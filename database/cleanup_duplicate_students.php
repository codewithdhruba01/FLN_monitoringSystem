<?php

declare(strict_types=1);

require __DIR__ . '/../api/db.php';
require __DIR__ . '/../api/workbook_data.php';

function normalizeCleanupStudentName(string $value): string
{
    return strtolower(trim(preg_replace('/\s+/', ' ', $value) ?? ''));
}

function normalizeCleanupClassName(string $value): string
{
    return normalizeWorkbookClassName($value);
}

function cleanupStudentKey(array $student): string
{
    return implode('|', [
        (string) $student['school_id'],
        normalizeCleanupStudentName((string) $student['full_name']),
        strtolower(normalizeCleanupClassName((string) $student['class_name'])),
    ]);
}

function chooseCanonicalStudent(array $left, array $right): array
{
    $leftClass = normalizeCleanupClassName((string) $left['class_name']);
    $rightClass = normalizeCleanupClassName((string) $right['class_name']);

    if ($leftClass !== $rightClass) {
        if ($rightClass === $right['class_name']) {
            return $right;
        }

        if ($leftClass === $left['class_name']) {
            return $left;
        }
    }

    return (int) $right['id'] > (int) $left['id'] ? $right : $left;
}

function dedupeAttendanceTable(PDO $pdo): int
{
    $rows = $pdo->query(
        'SELECT id, report_id, student_id
         FROM student_attendance
         WHERE student_id IS NOT NULL
         ORDER BY report_id ASC, student_id ASC, id DESC'
    )->fetchAll();

    $seen = [];
    $duplicateIds = [];

    foreach ($rows as $row) {
        $key = $row['report_id'] . '|' . $row['student_id'];
        if (isset($seen[$key])) {
            $duplicateIds[] = (int) $row['id'];
            continue;
        }

        $seen[$key] = true;
    }

    if ($duplicateIds === []) {
        return 0;
    }

    $delete = $pdo->prepare('DELETE FROM student_attendance WHERE id = :id');
    foreach ($duplicateIds as $id) {
        $delete->execute(['id' => $id]);
    }

    return count($duplicateIds);
}

function dedupePerformanceTable(PDO $pdo): int
{
    $rows = $pdo->query(
        'SELECT id, report_id, student_id
         FROM student_performance
         WHERE student_id IS NOT NULL
         ORDER BY report_id ASC, student_id ASC, id DESC'
    )->fetchAll();

    $seen = [];
    $duplicateIds = [];

    foreach ($rows as $row) {
        $key = $row['report_id'] . '|' . $row['student_id'];
        if (isset($seen[$key])) {
            $duplicateIds[] = (int) $row['id'];
            continue;
        }

        $seen[$key] = true;
    }

    if ($duplicateIds === []) {
        return 0;
    }

    $delete = $pdo->prepare('DELETE FROM student_performance WHERE id = :id');
    foreach ($duplicateIds as $id) {
        $delete->execute(['id' => $id]);
    }

    return count($duplicateIds);
}

function refreshReportAttendanceCounts(PDO $pdo): int
{
    $reportIds = $pdo->query('SELECT id FROM monitoring_reports')->fetchAll(PDO::FETCH_COLUMN);
    $update = $pdo->prepare(
        'UPDATE monitoring_reports
         SET students_present = :students_present,
             boys_present = :boys_present,
             girls_present = :girls_present
         WHERE id = :id'
    );

    $reportsUpdated = 0;
    foreach ($reportIds as $reportId) {
        $summary = $pdo->prepare(
            "SELECT
                COALESCE(SUM(CASE WHEN sa.attendance_status = 'present' THEN 1 ELSE 0 END), 0) AS students_present,
                COALESCE(SUM(CASE WHEN sa.attendance_status = 'present' AND s.gender = 'Boy' THEN 1 ELSE 0 END), 0) AS boys_present,
                COALESCE(SUM(CASE WHEN sa.attendance_status = 'present' AND s.gender = 'Girl' THEN 1 ELSE 0 END), 0) AS girls_present
             FROM student_attendance sa
             LEFT JOIN students s ON s.id = sa.student_id
             WHERE sa.report_id = :report_id"
        );
        $summary->execute(['report_id' => (int) $reportId]);
        $counts = $summary->fetch() ?: ['students_present' => 0, 'boys_present' => 0, 'girls_present' => 0];

        $update->execute([
            'students_present' => (int) $counts['students_present'],
            'boys_present' => (int) $counts['boys_present'],
            'girls_present' => (int) $counts['girls_present'],
            'id' => (int) $reportId,
        ]);
        $reportsUpdated++;
    }

    return $reportsUpdated;
}

$pdo = getDatabaseConnection();
$pdo->beginTransaction();

try {
    $students = $pdo->query(
        'SELECT id, school_id, full_name, class_name
         FROM students
         ORDER BY school_id ASC, full_name ASC, id ASC'
    )->fetchAll();

    $groups = [];
    foreach ($students as $student) {
        $groups[cleanupStudentKey($student)][] = $student;
    }

    $updateStudentClass = $pdo->prepare('UPDATE students SET class_name = :class_name WHERE id = :id');
    $updateAttendanceStudent = $pdo->prepare('UPDATE student_attendance SET student_id = :target_id WHERE student_id = :source_id');
    $updatePerformanceStudent = $pdo->prepare('UPDATE student_performance SET student_id = :target_id WHERE student_id = :source_id');
    $deleteStudent = $pdo->prepare('DELETE FROM students WHERE id = :id');

    $duplicateGroups = 0;
    $studentsDeleted = 0;

    foreach ($groups as $group) {
        if (count($group) < 2) {
            continue;
        }

        $duplicateGroups++;
        $groupMembers = $group;
        $canonical = $groupMembers[0];
        foreach ($groupMembers as $candidate) {
            $canonical = chooseCanonicalStudent($canonical, $candidate);
        }

        $normalizedClassName = normalizeCleanupClassName((string) $canonical['class_name']);
        if ($canonical['class_name'] !== $normalizedClassName) {
            $updateStudentClass->execute([
                'class_name' => $normalizedClassName,
                'id' => (int) $canonical['id'],
            ]);
        }

        foreach ($groupMembers as $student) {
            if ((int) $student['id'] === (int) $canonical['id']) {
                continue;
            }

            $updateAttendanceStudent->execute([
                'target_id' => (int) $canonical['id'],
                'source_id' => (int) $student['id'],
            ]);
            $updatePerformanceStudent->execute([
                'target_id' => (int) $canonical['id'],
                'source_id' => (int) $student['id'],
            ]);
            $deleteStudent->execute(['id' => (int) $student['id']]);
            $studentsDeleted++;
        }
    }

    $attendanceRowsDeleted = dedupeAttendanceTable($pdo);
    $performanceRowsDeleted = dedupePerformanceTable($pdo);
    $reportsUpdated = refreshReportAttendanceCounts($pdo);

    $pdo->commit();

    echo json_encode([
        'duplicate_groups' => $duplicateGroups,
        'students_deleted' => $studentsDeleted,
        'attendance_rows_deleted' => $attendanceRowsDeleted,
        'performance_rows_deleted' => $performanceRowsDeleted,
        'reports_updated' => $reportsUpdated,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . PHP_EOL;
} catch (Throwable $exception) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    fwrite(STDERR, $exception->getMessage() . PHP_EOL);
    exit(1);
}
