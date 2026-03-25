<?php

declare(strict_types=1);

require __DIR__ . '/../api/db.php';

const WORKBOOK_PATH = __DIR__ . '/../Students List Maval, Halol.xlsx';

function loadSharedStrings(ZipArchive $zip): array
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

function loadWorksheetMap(ZipArchive $zip): array
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

function columnFromReference(string $reference): string
{
    if (preg_match('/^[A-Z]+/', $reference, $matches) !== 1) {
        return '';
    }

    return $matches[0];
}

function readWorksheetRows(ZipArchive $zip, string $worksheetPath, array $sharedStrings): array
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
            $column = columnFromReference($reference);
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

function parseWorkbookData(string $workbookPath): array
{
    $zip = new ZipArchive();
    if ($zip->open($workbookPath) !== true) {
        throw new RuntimeException('Unable to open workbook.');
    }

    $sharedStrings = loadSharedStrings($zip);
    $worksheetMap = loadWorksheetMap($zip);

    $teacherSheets = [
        'Halol' => ['cluster_id' => 1, 'teacher_column' => 'A'],
        'Maval' => ['cluster_id' => 2, 'teacher_column' => 'I'],
    ];

    $studentSheets = [
        'Halol Students' => ['cluster_id' => 1],
        'Maval Student' => ['cluster_id' => 2],
    ];

    $teachersByCluster = [1 => [], 2 => []];
    $studentsByCluster = [1 => [], 2 => []];

    foreach ($teacherSheets as $sheetName => $config) {
        $rows = readWorksheetRows($zip, $worksheetMap[$sheetName], $sharedStrings);
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
        $rows = readWorksheetRows($zip, $worksheetMap[$sheetName], $sharedStrings);
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
                || stripos($className, 'class') !== false
            ) {
                continue;
            }

            $studentsByCluster[$config['cluster_id']][] = [
                'school_name' => $schoolName,
                'name' => $studentName,
                'class_name' => $className,
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

function normalizeSchoolName(string $value): string
{
    $value = preg_replace('/\s+/', ' ', trim($value)) ?? '';
    if (preg_match('/\(([^()]*)\)/', $value, $matches) === 1) {
        $value = trim($matches[1]);
    }

    $value = strtolower($value);
    $value = str_replace(
        ['.', ',', '-', '(', ')'],
        ' ',
        $value
    );
    $value = preg_replace('/\s+/', ' ', $value) ?? '';

    $replacements = [
        'aedelpura' => 'aedalpura',
        'kharkhdi' => 'kharkadi',
        'baddalwadi' => 'badhalwadi',
        'navalakh' => 'navlakh',
    ];

    return strtr(trim($value), $replacements);
}

function buildSchoolLookup(PDO $pdo): array
{
    $lookup = [];
    foreach ($pdo->query('SELECT id, cluster_id, name FROM schools') as $school) {
        $lookup[(int) $school['cluster_id']][normalizeSchoolName((string) $school['name'])] = (int) $school['id'];
    }

    $aliases = [
        1 => [
            normalizeSchoolName('ઢીંકવા પ્રાથમિક શાળા (Dhikva Primary School)') => 9,
            normalizeSchoolName('સાથરોટા પ્રાથમિક શાળા (Sathrota Primary School)') => null,
            normalizeSchoolName('એદલપુરા પ્રાથમિક શાળા (Aedelpura Primary School)') => 5,
            normalizeSchoolName('ખરખડી પ્રાથમિક શાળા (Kharkhdi Primary School)') => 10,
            normalizeSchoolName('નવા જખરીયા પ્રાથમિક શાળા (Nava Jakhriya Primary School)') => 11,
            normalizeSchoolName('પારોલી પ્રાથમિક શાળા (Paroli Primary School)') => null,
        ],
        2 => [
            normalizeSchoolName('Ambi') => 16,
            normalizeSchoolName('Baddalwadi, Maval, Pune') => 17,
            normalizeSchoolName('Kashal, Pune') => null,
            normalizeSchoolName('Nanoli, Maval, Pune') => 18,
            normalizeSchoolName('Navalakh Umbre, Maval, Pune') => 19,
            normalizeSchoolName('Urse, Maval, Pune') => 20,
            normalizeSchoolName('Varale, Maval, Pune') => 21,
        ],
    ];

    foreach ($aliases as $clusterId => $clusterAliases) {
        foreach ($clusterAliases as $alias => $schoolId) {
            $lookup[$clusterId][$alias] = $schoolId;
        }
    }

    return $lookup;
}

function inferGenderFromName(string $name): string
{
    $normalized = strtolower(trim($name));
    $tokens = preg_split('/[^a-z]+/', $normalized) ?: [];
    $firstToken = $tokens[0] ?? '';

    $girlMarkers = [
        'ben', 'bai', 'kumari', 'priyanka', 'pooja', 'rupali', 'sayali', 'sonali', 'archana', 'bhagyashree',
        'kajal', 'kalyani', 'komal', 'anjali', 'shruti', 'sunita', 'maya', 'pari', 'lakshmi', 'aarti',
        'janhavi', 'mansi', 'trisha', 'payal', 'aishwarya', 'shivani', 'riddhi', 'sejal', 'savitri', 'tejal',
        'kinjal', 'hiral', 'sanjana', 'priyanka', 'janhavi', 'swara', 'prachi', 'palak', 'sumitra', 'roshni',
        'kajalben', 'pritiben', 'dayaben', 'vasantaben', 'devanshiben', 'lakshmitaben', 'jiyaben',
    ];

    $boyMarkers = [
        'bhai', 'kumar', 'singh', 'rajdeep', 'rahul', 'umesh', 'narendra', 'vishal', 'vijay', 'aditya',
        'shravan', 'yuvraj', 'sahil', 'ravi', 'rajesh', 'dhruv', 'prince', 'kartik', 'pradip', 'amit',
        'sandip', 'hitesh', 'jaydeep', 'jigar', 'kalpesh', 'kushal', 'kishan', 'vivek', 'varun', 'abhay',
        'pranav', 'rohit', 'vedant', 'pritesh', 'akash', 'harshad', 'haresh', 'jagdish', 'jitesh', 'kamlesh',
    ];

    if ($firstToken !== '') {
        if (in_array($firstToken, $girlMarkers, true) || str_ends_with($firstToken, 'ben') || str_ends_with($firstToken, 'bai')) {
            return 'Girl';
        }

        if (
            in_array($firstToken, $boyMarkers, true)
            || str_contains($firstToken, 'bhai')
            || str_contains($firstToken, 'kumar')
            || str_contains($firstToken, 'singh')
        ) {
            return 'Boy';
        }
    }

    foreach ($tokens as $token) {
        if (str_ends_with($token, 'ben') || str_ends_with($token, 'bai')) {
            return 'Girl';
        }
    }

    if (str_contains($normalized, 'bhai') || str_contains($normalized, 'kumar') || str_contains($normalized, 'singh')) {
        return 'Boy';
    }

    foreach ($tokens as $token) {
        if (in_array($token, $girlMarkers, true)) {
            return 'Girl';
        }
    }

    if (str_contains($normalized, 'ben') || str_contains($normalized, 'bai')) {
        return 'Girl';
    }

    foreach ($tokens as $token) {
        if (in_array($token, $boyMarkers, true)) {
            return 'Boy';
        }
    }

    if (preg_match('/a$|i$/', $firstToken) === 1) {
        return 'Girl';
    }

    if ($firstToken !== '') {
        return 'Boy';
    }

    return 'Girl';
}

$pdo = getDatabaseConnection();
$data = parseWorkbookData(WORKBOOK_PATH);

ensureStudentClassColumn($pdo);
$schoolLookup = buildSchoolLookup($pdo);

$pdo->beginTransaction();
$teacherLookup = $pdo->prepare(
    'SELECT id FROM teachers WHERE cluster_id = :cluster_id AND full_name = :full_name LIMIT 1'
);
$teacherInsert = $pdo->prepare('INSERT INTO teachers (cluster_id, school_id, full_name) VALUES (:cluster_id, :school_id, :full_name)');

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
    'SELECT id FROM students
     WHERE cluster_id = :cluster_id AND school_id = :school_id AND full_name = :full_name AND class_name = :class_name
     LIMIT 1'
);
$studentInsert = $pdo->prepare('INSERT INTO students (cluster_id, school_id, full_name, class_name, gender) VALUES (:cluster_id, :school_id, :full_name, :class_name, :gender)');
$studentUpdate = $pdo->prepare('UPDATE students SET gender = :gender WHERE id = :id');

foreach ($data['students'] as $clusterId => $students) {
    foreach ($students as $student) {
        $normalizedSchool = normalizeSchoolName($student['school_name']);
        $schoolId = $schoolLookup[$clusterId][$normalizedSchool] ?? null;
        if ($schoolId === null) {
            continue;
        }

        $gender = inferGenderFromName($student['name']);

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
