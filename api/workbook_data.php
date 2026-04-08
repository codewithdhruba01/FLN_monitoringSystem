<?php

declare(strict_types=1);

const WORKBOOK_DATA_PATH = __DIR__ . '/../Students List Maval, Halol.xlsx';

function normalizeWorkbookClassName(string $value): string
{
    $value = trim($value);
    if ($value === '') {
        return '';
    }

    if (preg_match('/(\d+)/', $value, $matches) !== 1) {
        return $value;
    }

    return 'Class ' . $matches[1];
}

function getWorkbookSchoolDirectory(): array
{
    return [
        'Halol' => [
            ['id' => 1, 'name' => 'Abhetlav Primary School', 'teachers' => ['Anjaliben Manharbhai Varia']],
            ['id' => 2, 'name' => 'Academy Centre - Masvad', 'teachers' => ['Chavda Hansaben']],
            ['id' => 3, 'name' => 'Academy Centre - Arad', 'teachers' => ['Dharmeshsinh Parmar']],
            ['id' => 4, 'name' => 'Academy Centre - Govind Puri', 'teachers' => ['Divyaben Kesharsinh Rathod']],
            ['id' => 5, 'name' => 'Aedalpura Primary School', 'teachers' => ['Khumansinh Dolatsinh Solanki']],
            ['id' => 6, 'name' => 'Govindpuri Remedial(LIB)', 'teachers' => ['Lalita Ghojage']],
            ['id' => 7, 'name' => 'Lalpuri Primary School', 'teachers' => ['Manaharkumar Parmar']],
            ['id' => 8, 'name' => 'Rahtlav Primary School', 'teachers' => ['Mitulsinh Solanki']],
            ['id' => 9, 'name' => 'Dhikva Primary School', 'teachers' => ['Priyanka']],
            ['id' => 10, 'name' => 'Kharkadi Primary School', 'teachers' => ['Priyankaben']],
            ['id' => 11, 'name' => 'Nava Jakhriya Primary School', 'teachers' => ['Sanjana Parmar']],
            ['id' => 12, 'name' => 'Pindgini Muvadi Primary School', 'teachers' => ['Vishnubhai']],
        ],
        'Maval' => [
            ['id' => 13, 'name' => 'Shri Chhtrapati Shivaji Vcidya Mandir, Kanhe', 'teachers' => ['Archana Shinde']],
            ['id' => 14, 'name' => 'Shriram Vidyalaya, Navalakh Umbre', 'teachers' => ['Bhagyashree Ganesh Marathe']],
            ['id' => 15, 'name' => 'Z P Primary Schoool, Bhoyare', 'teachers' => ['Kajal Bansode']],
            ['id' => 16, 'name' => 'Z.P. Primary School,Ambi', 'teachers' => ['Kalyani Thakur']],
            ['id' => 17, 'name' => 'Z.P. Primary School, Badhalwadi', 'teachers' => ['Komal Shirke']],
            ['id' => 18, 'name' => 'Z.P.Primary School Nanoli Tarfe Chakan', 'teachers' => ['Pooja Swapnil Bhosale']],
            ['id' => 19, 'name' => 'Z.P. Primary School, Navlakh Umbre', 'teachers' => ['Rupali Jambhulkar']],
            ['id' => 20, 'name' => 'Z.P. Primary School, Urse', 'teachers' => ['Sayali Sushant Chavan']],
            ['id' => 21, 'name' => 'Z.P. Primary School, Varale', 'teachers' => ['Sonali Gaikwad']],
        ],
    ];
}

function getWorkbookSchoolAliases(): array
{
    return [
        'Halol' => [
            normalizeWorkbookSchoolName('ઢીંકવા પ્રાથમિક શાળા (Dhikva Primary School)') => 'Dhikva Primary School',
            normalizeWorkbookSchoolName('સાથરોટા પ્રાથમિક શાળા (Sathrota Primary School)') => 'Sathrota Primary School',
            normalizeWorkbookSchoolName('એદલપુરા પ્રાથમિક શાળા (Aedelpura Primary School)') => 'Aedalpura Primary School',
            normalizeWorkbookSchoolName('ખરખડી પ્રાથમિક શાળા (Kharkhdi Primary School)') => 'Kharkadi Primary School',
            normalizeWorkbookSchoolName('નવા જખરીયા પ્રાથમિક શાળા (Nava Jakhriya Primary School)') => 'Nava Jakhriya Primary School',
            normalizeWorkbookSchoolName('પારોલી પ્રાથમિક શાળા (Paroli Primary School)') => 'Paroli Primary School',
        ],
        'Maval' => [
            normalizeWorkbookSchoolName('Ambi') => 'Z.P. Primary School,Ambi',
            normalizeWorkbookSchoolName('Baddalwadi, Maval, Pune') => 'Z.P. Primary School, Badhalwadi',
            normalizeWorkbookSchoolName('Kashal, Pune') => 'Z.P. School, Kashal',
            normalizeWorkbookSchoolName('Nanoli, Maval, Pune') => 'Z.P.Primary School Nanoli Tarfe Chakan',
            normalizeWorkbookSchoolName('Navalakh Umbre, Maval, Pune') => 'Z.P. Primary School, Navlakh Umbre',
            normalizeWorkbookSchoolName('Urse, Maval, Pune') => 'Z.P. Primary School, Urse',
            normalizeWorkbookSchoolName('Varale, Maval, Pune') => 'Z.P. Primary School, Varale',
        ],
    ];
}

function resolveWorkbookSchoolDisplayName(string $clusterName, string $schoolName): string
{
    $normalized = normalizeWorkbookSchoolName($schoolName);
    return getWorkbookSchoolAliases()[$clusterName][$normalized] ?? $schoolName;
}

function getWorkbookClusterTeachers(string $clusterName): array
{
    $teacherNames = [];
    foreach (getWorkbookSchoolDirectory()[$clusterName] ?? [] as $school) {
        foreach ($school['teachers'] ?? [] as $teacherName) {
            $teacherNames[$teacherName] = true;
        }
    }

    return array_keys($teacherNames);
}

function normalizeWorkbookSchoolName(string $value): string
{
    $value = preg_replace('/\s+/', ' ', trim($value)) ?? '';
    if (preg_match('/\(([^()]*)\)/', $value, $matches) === 1) {
        $value = trim($matches[1]);
    }

    $value = strtolower($value);
    $value = str_replace(['.', ',', '-', '(', ')'], ' ', $value);
    $value = preg_replace('/\s+/', ' ', $value) ?? '';

    return trim(strtr($value, [
        'aedelpura' => 'aedalpura',
        'kharkhdi' => 'kharkadi',
        'baddalwadi' => 'badhalwadi',
        'navalakh' => 'navlakh',
    ]));
}

function inferWorkbookStudentGender(string $name): string
{
    $normalized = strtolower(trim($name));
    $tokens = preg_split('/[^a-z]+/', $normalized) ?: [];
    $firstToken = $tokens[0] ?? '';

    if ($firstToken === '') {
        return '';
    }

    if (
        str_ends_with($firstToken, 'ben')
        || str_ends_with($firstToken, 'bai')
        || preg_match('/a$|i$/', $firstToken) === 1
    ) {
        return 'Girl';
    }

    if (
        str_contains($normalized, 'bhai')
        || str_contains($normalized, 'kumar')
        || str_contains($normalized, 'singh')
    ) {
        return 'Boy';
    }

    return 'Boy';
}

function loadWorkbookSharedStrings(ZipArchive $zip): array
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

function loadWorkbookWorksheetMap(ZipArchive $zip): array
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

function workbookColumnFromReference(string $reference): string
{
    if (preg_match('/^[A-Z]+/', $reference, $matches) !== 1) {
        return '';
    }

    return $matches[0];
}

function readWorkbookRows(ZipArchive $zip, string $worksheetPath, array $sharedStrings): array
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
            $column = workbookColumnFromReference($reference);
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

function loadWorkbookStudentsByCluster(): array
{
    static $studentsByCluster = null;

    if ($studentsByCluster !== null) {
        return $studentsByCluster;
    }

    if (!is_file(WORKBOOK_DATA_PATH)) {
        $studentsByCluster = [];
        return $studentsByCluster;
    }

    $zip = new ZipArchive();
    if ($zip->open(WORKBOOK_DATA_PATH) !== true) {
        throw new RuntimeException('Unable to open workbook.');
    }

    $sharedStrings = loadWorkbookSharedStrings($zip);
    $worksheetMap = loadWorkbookWorksheetMap($zip);
    $studentSheets = [
        'Halol Students' => 'Halol',
        'Maval Student' => 'Maval',
    ];

    $studentsByCluster = ['Halol' => [], 'Maval' => []];

    foreach ($studentSheets as $sheetName => $clusterName) {
        if (!isset($worksheetMap[$sheetName])) {
            continue;
        }

        $rows = readWorkbookRows($zip, $worksheetMap[$sheetName], $sharedStrings);
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

            $studentsByCluster[$clusterName][] = [
                'school_name' => resolveWorkbookSchoolDisplayName($clusterName, $schoolName),
                'name' => $studentName,
                'className' => normalizeWorkbookClassName($className),
                'gender' => inferWorkbookStudentGender($studentName),
            ];
        }
    }

    $zip->close();

    return $studentsByCluster;
}

function getWorkbookSchoolContext(string $clusterName, string $schoolName): ?array
{
    $directory = getWorkbookSchoolDirectory();
    $clusterSchools = $directory[$clusterName] ?? [];
    $requestedSchool = normalizeWorkbookSchoolName($schoolName);
    $targetSchool = null;

    foreach ($clusterSchools as $school) {
        if (normalizeWorkbookSchoolName($school['name']) === $requestedSchool) {
            $targetSchool = $school;
            break;
        }
    }

    if ($targetSchool === null) {
        return null;
    }

    $students = [];
    $clusterStudents = loadWorkbookStudentsByCluster()[$clusterName] ?? [];
    $studentId = 1;
    foreach ($clusterStudents as $student) {
        if (normalizeWorkbookSchoolName($student['school_name']) !== $requestedSchool) {
            continue;
        }

        $students[] = [
            'id' => $studentId++,
            'name' => $student['name'],
            'className' => normalizeWorkbookClassName($student['className']),
            'gender' => $student['gender'],
        ];
    }

    return [
        'cluster' => [
            'id' => $clusterName === 'Halol' ? 1 : 2,
            'name' => $clusterName,
        ],
        'school' => [
            'id' => $targetSchool['id'],
            'name' => $targetSchool['name'],
        ],
        'teachers' => array_map(
            static fn(string $teacherName, int $index): array => [
                'id' => $index + 1,
                'name' => $teacherName,
            ],
            getWorkbookClusterTeachers($clusterName),
            array_keys(getWorkbookClusterTeachers($clusterName))
        ),
        'students' => $students,
    ];
}
