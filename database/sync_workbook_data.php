<?php

declare(strict_types=1);

require __DIR__ . '/../api/db.php';
require __DIR__ . '/../api/workbook_data.php';

const WORKBOOK_PATH = __DIR__ . '/../Students List Maval, Halol.xlsx';

function loadSharedStringsForSync(ZipArchive $zip): array
{
    $xml = $zip->getFromName('xl/sharedStrings.xml');
    if ($xml === false) {
        return [];
    }

    $root = simplexml_load_string($xml);
    if ($root === false) {
        return [];
    }

    $values = [];
    foreach ($root->xpath('//*[local-name()="si"]') ?: [] as $item) {
        $parts = $item->xpath('.//*[local-name()="t"]') ?: [];
        $values[] = implode('', array_map(static fn(SimpleXMLElement $text): string => (string) $text, $parts));
    }

    return $values;
}

function loadWorksheetMapForSync(ZipArchive $zip): array
{
    $workbook = simplexml_load_string((string) $zip->getFromName('xl/workbook.xml'));
    $rels = simplexml_load_string((string) $zip->getFromName('xl/_rels/workbook.xml.rels'));

    if ($workbook === false || $rels === false) {
        throw new RuntimeException('Unable to read workbook metadata.');
    }

    $relationMap = [];
    foreach ($rels->xpath('//*[local-name()="Relationship"]') ?: [] as $relation) {
        $relationMap[(string) $relation['Id']] = (string) $relation['Target'];
    }

    $worksheets = [];
    foreach ($workbook->xpath('//*[local-name()="sheet"]') ?: [] as $sheet) {
        $attributes = $sheet->attributes('http://schemas.openxmlformats.org/officeDocument/2006/relationships');
        $relationId = (string) $attributes['id'];
        $target = $relationMap[$relationId] ?? '';
        if ($target !== '' && !str_starts_with($target, 'worksheets/')) {
            $target = 'worksheets/' . basename($target);
        }

        $worksheets[(string) $sheet['name']] = 'xl/' . $target;
    }

    return $worksheets;
}

function columnFromReferenceForSync(string $reference): string
{
    if (preg_match('/^[A-Z]+/', $reference, $matches) !== 1) {
        return '';
    }

    return $matches[0];
}

function readWorksheetRowsForSync(ZipArchive $zip, string $worksheetPath, array $sharedStrings): array
{
    $xml = $zip->getFromName($worksheetPath);
    if ($xml === false) {
        throw new RuntimeException("Worksheet not found: {$worksheetPath}");
    }

    $sheet = simplexml_load_string($xml);
    if ($sheet === false) {
        throw new RuntimeException("Unable to parse worksheet: {$worksheetPath}");
    }

    $rows = [];
    foreach ($sheet->xpath('//*[local-name()="row"]') ?: [] as $row) {
        $rowValues = [];
        foreach ($row->xpath('./*[local-name()="c"]') ?: [] as $cell) {
            $reference = (string) $cell['r'];
            $column = columnFromReferenceForSync($reference);
            $type = (string) $cell['t'];
            $valueNodes = $cell->xpath('./*[local-name()="v"]') ?: [];
            $textNodes = $cell->xpath('.//*[local-name()="t"]') ?: [];

            if ($type === 's' && isset($valueNodes[0])) {
                $index = (int) $valueNodes[0];
                $rowValues[$column] = trim($sharedStrings[$index] ?? '');
                continue;
            }

            if ($type === 'inlineStr' && $textNodes !== []) {
                $rowValues[$column] = trim(implode('', array_map(static fn(SimpleXMLElement $text): string => (string) $text, $textNodes)));
                continue;
            }

            $rowValues[$column] = isset($valueNodes[0]) ? trim((string) $valueNodes[0]) : '';
        }

        $rows[] = $rowValues;
    }

    return $rows;
}

function parseWorkbookDataForSync(string $workbookPath): array
{
    $zip = new ZipArchive();
    if ($zip->open($workbookPath) !== true) {
        throw new RuntimeException('Unable to open workbook.');
    }

    $sharedStrings = loadSharedStringsForSync($zip);
    $worksheetMap = loadWorksheetMapForSync($zip);

    $teacherSheets = [
        'Halol' => ['cluster_id' => 1, 'teacher_column' => 'A'],
        'Maval' => ['cluster_id' => 2, 'teacher_column' => 'I'],
    ];

    $studentSheets = [
        'Halol Students' => ['cluster' => 'Halol', 'cluster_id' => 1],
        'Maval Student' => ['cluster' => 'Maval', 'cluster_id' => 2],
    ];

    $teachersByCluster = [1 => [], 2 => []];
    $studentsByCluster = [1 => [], 2 => []];

    foreach ($teacherSheets as $sheetName => $config) {
        $rows = readWorksheetRowsForSync($zip, $worksheetMap[$sheetName], $sharedStrings);
        foreach ($rows as $row) {
            $teacherName = trim($row[$config['teacher_column']] ?? '');
            if ($teacherName === '' || stripos($teacherName, 'teacher') !== false || stripos($teacherName, 'school wise') !== false) {
                continue;
            }

            $teachersByCluster[$config['cluster_id']][] = $teacherName;
        }

        $teachersByCluster[$config['cluster_id']] = array_values(array_unique($teachersByCluster[$config['cluster_id']]));
    }

    foreach ($studentSheets as $sheetName => $config) {
        $rows = readWorksheetRowsForSync($zip, $worksheetMap[$sheetName], $sharedStrings);
        foreach ($rows as $row) {
            $schoolName = trim($row['A'] ?? '');
            $studentName = trim($row['B'] ?? '');
            $className = trim($row['C'] ?? '');

            if (
                $schoolName === ''
                || $studentName === ''
                || $className === ''
                || stripos($schoolName, 'school name') !== false
                || stripos($studentName, 'student name') !== false
            ) {
                continue;
            }

            $studentsByCluster[$config['cluster_id']][] = [
                'school_name' => resolveWorkbookSchoolDisplayName($config['cluster'], $schoolName),
                'name' => $studentName,
                'class_name' => normalizeWorkbookClassName($className),
            ];
        }
    }

    $zip->close();

    return [
        'teachers' => $teachersByCluster,
        'students' => $studentsByCluster,
    ];
}

function ensureStudentClassColumn(PDO $pdo): void
{
    $statement = $pdo->query("SHOW COLUMNS FROM students LIKE 'class_name'");
    $column = $statement !== false ? $statement->fetch() : false;

    if ($column === false) {
        $pdo->exec("ALTER TABLE students ADD COLUMN class_name VARCHAR(20) NOT NULL DEFAULT '' AFTER full_name");
    }
}

function buildSchoolLookup(PDO $pdo): array
{
    $lookup = [];
    foreach ($pdo->query('SELECT id, cluster_id, name FROM schools') as $school) {
        $lookup[(int) $school['cluster_id']][normalizeWorkbookSchoolName((string) $school['name'])] = (int) $school['id'];
    }

    foreach (getWorkbookSchoolAliases() as $clusterName => $aliases) {
        $clusterId = $clusterName === 'Halol' ? 1 : 2;
        foreach ($aliases as $alias => $schoolName) {
            $normalizedSchoolName = normalizeWorkbookSchoolName($schoolName);
            if (isset($lookup[$clusterId][$normalizedSchoolName])) {
                $lookup[$clusterId][$alias] = $lookup[$clusterId][$normalizedSchoolName];
            }
        }
    }

    return $lookup;
}

$pdo = getDatabaseConnection();
$data = parseWorkbookDataForSync(WORKBOOK_PATH);

ensureStudentClassColumn($pdo);
$schoolLookup = buildSchoolLookup($pdo);

$pdo->beginTransaction();

$teacherLookup = $pdo->prepare(
    'SELECT id FROM teachers WHERE cluster_id = :cluster_id AND full_name = :full_name LIMIT 1'
);
$teacherInsert = $pdo->prepare(
    'INSERT INTO teachers (cluster_id, school_id, full_name) VALUES (:cluster_id, :school_id, :full_name)'
);

foreach ($data['teachers'] as $clusterId => $teacherNames) {
    foreach ($teacherNames as $teacherName) {
        $teacherLookup->execute([
            'cluster_id' => $clusterId,
            'full_name' => $teacherName,
        ]);

        if ($teacherLookup->fetch() !== false) {
            continue;
        }

        $teacherInsert->execute([
            'cluster_id' => $clusterId,
            'school_id' => $clusterId === 1 ? 1 : 13,
            'full_name' => $teacherName,
        ]);
    }
}

$studentLookup = $pdo->prepare(
    'SELECT id
     FROM students
     WHERE cluster_id = :cluster_id
       AND school_id = :school_id
       AND full_name = :full_name
       AND class_name = :class_name
     LIMIT 1'
);
$studentInsert = $pdo->prepare(
    'INSERT INTO students (cluster_id, school_id, full_name, class_name, gender)
     VALUES (:cluster_id, :school_id, :full_name, :class_name, :gender)'
);
$studentUpdate = $pdo->prepare(
    'UPDATE students SET gender = :gender, class_name = :class_name WHERE id = :id'
);

foreach ($data['students'] as $clusterId => $students) {
    foreach ($students as $student) {
        $normalizedSchool = normalizeWorkbookSchoolName($student['school_name']);
        $schoolId = $schoolLookup[$clusterId][$normalizedSchool] ?? null;
        if ($schoolId === null) {
            continue;
        }

        $gender = inferWorkbookStudentGender($student['name']);

        $studentLookup->execute([
            'cluster_id' => $clusterId,
            'school_id' => $schoolId,
            'full_name' => $student['name'],
            'class_name' => $student['class_name'],
        ]);

        $existingStudent = $studentLookup->fetch();
        if ($existingStudent !== false) {
            $studentUpdate->execute([
                'gender' => $gender,
                'class_name' => $student['class_name'],
                'id' => $existingStudent['id'],
            ]);
            continue;
        }

        $studentInsert->execute([
            'cluster_id' => $clusterId,
            'school_id' => $schoolId,
            'full_name' => $student['name'],
            'class_name' => $student['class_name'],
            'gender' => $gender,
        ]);
    }
}

$pdo->commit();

echo 'Workbook data synced successfully.' . PHP_EOL;
