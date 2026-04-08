<?php

declare(strict_types=1);

require __DIR__ . '/../api/workbook_data.php';

$studentsByCluster = loadWorkbookStudentsByCluster();
$directory = getWorkbookSchoolDirectory();

foreach ($directory as $cluster => $schools) {
    echo "=== {$cluster} ===" . PHP_EOL;

    $studentLookup = [];
    foreach ($studentsByCluster[$cluster] ?? [] as $student) {
        $normalizedSchool = normalizeWorkbookSchoolName($student['school_name']);
        $studentLookup[$normalizedSchool]['school_name'] = $student['school_name'];
        $studentLookup[$normalizedSchool]['count'] = ($studentLookup[$normalizedSchool]['count'] ?? 0) + 1;
        $studentLookup[$normalizedSchool]['classes'][$student['className']] = true;
    }

    foreach ($schools as $school) {
        $normalized = normalizeWorkbookSchoolName($school['name']);
        $entry = $studentLookup[$normalized] ?? null;
        $classes = $entry ? implode(', ', array_keys($entry['classes'])) : '-';
        $count = $entry['count'] ?? 0;

        echo sprintf(
            "%s | workbook_match=%s | students=%d | classes=%s",
            $school['name'],
            $entry ? 'yes' : 'no',
            $count,
            $classes
        ) . PHP_EOL;
    }

    echo PHP_EOL;
}
