<?php

declare(strict_types=1);

require_once __DIR__ . '/workbook_data.php';

function normalizeAnalyticsStudentName(string $value): string
{
    return strtolower(trim(preg_replace('/\s+/', ' ', $value) ?? ''));
}

function buildAnalyticsStudentKey(string $studentName, string $className): string
{
    return normalizeAnalyticsStudentName($studentName) . '|' . strtolower(normalizeWorkbookClassName($className));
}

function shouldReplaceAnalyticsStudent(array $current, array $candidate): bool
{
    $currentClass = normalizeWorkbookClassName((string) ($current['class_name'] ?? ''));
    $candidateClass = normalizeWorkbookClassName((string) ($candidate['class_name'] ?? ''));

    if ($currentClass !== $candidateClass && str_starts_with($candidateClass, 'Class ')) {
        return true;
    }

    return (int) ($candidate['id'] ?? 0) > (int) ($current['id'] ?? 0);
}

function dedupeAnalyticsStudents(array $rows): array
{
    $uniqueStudents = [];

    foreach ($rows as $row) {
        $row['class_name'] = normalizeWorkbookClassName((string) ($row['class_name'] ?? ''));
        $key = buildAnalyticsStudentKey((string) ($row['student_name'] ?? $row['full_name'] ?? ''), (string) $row['class_name']);

        if (!isset($uniqueStudents[$key]) || shouldReplaceAnalyticsStudent($uniqueStudents[$key], $row)) {
            $uniqueStudents[$key] = $row;
        }
    }

    return array_values($uniqueStudents);
}

function mergeStudentWiseAttendance(array $rows): array
{
    $merged = [];

    foreach ($rows as $row) {
        $className = normalizeWorkbookClassName((string) ($row['class_name'] ?? ''));
        $key = buildAnalyticsStudentKey((string) $row['student_name'], $className);

        if (!isset($merged[$key])) {
            $merged[$key] = [
                'id' => (int) $row['id'],
                'student_name' => (string) $row['student_name'],
                'class_name' => $className,
                'present_count' => (int) $row['present_count'],
                'absent_count' => (int) $row['absent_count'],
                'attendance_percentage' => (float) $row['attendance_percentage'],
                'total_marked' => (int) $row['total_marked'],
            ];
            continue;
        }

        $merged[$key]['present_count'] += (int) $row['present_count'];
        $merged[$key]['absent_count'] += (int) $row['absent_count'];
        $merged[$key]['total_marked'] += (int) $row['total_marked'];

        if ((int) $row['id'] > $merged[$key]['id']) {
            $merged[$key]['id'] = (int) $row['id'];
        }
    }

    foreach ($merged as &$student) {
        $student['attendance_percentage'] = $student['total_marked'] > 0
            ? round(($student['present_count'] / $student['total_marked']) * 100, 2)
            : 0.0;
        unset($student['total_marked']);
    }
    unset($student);

    return array_values($merged);
}

function analyticsTableExists(PDO $pdo, string $tableName): bool
{
    $statement = $pdo->prepare('SHOW TABLES LIKE :table_name');
    $statement->execute(['table_name' => $tableName]);

    return (bool) $statement->fetchColumn();
}

function normalizeAnalyticsFilters(array $input): array
{
    $today = new DateTimeImmutable('today');
    $defaultFrom = $today->modify('-29 days')->format('Y-m-d');
    $defaultTo = $today->format('Y-m-d');

    $fromDate = trim((string) ($input['from_date'] ?? $defaultFrom));
    $toDate = trim((string) ($input['to_date'] ?? $defaultTo));

    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $fromDate)) {
        $fromDate = $defaultFrom;
    }

    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $toDate)) {
        $toDate = $defaultTo;
    }

    if ($fromDate > $toDate) {
        [$fromDate, $toDate] = [$toDate, $fromDate];
    }

    return [
        'cluster' => trim((string) ($input['cluster'] ?? '')),
        'school' => trim((string) ($input['school'] ?? '')),
        'class_name' => normalizeAnalyticsClassFilter((string) ($input['class'] ?? '')),
        'from_date' => $fromDate,
        'to_date' => $toDate,
    ];
}

function normalizeAnalyticsClassFilter(string $value): string
{
    $value = trim($value);
    if ($value === '' || strcasecmp($value, 'All') === 0 || strcasecmp($value, 'All Classes') === 0) {
        return '';
    }

    return normalizeWorkbookClassName($value);
}

function buildStudentScope(array $filters): array
{
    $conditions = ['s.is_active = 1'];
    $params = [];

    if ($filters['cluster'] !== '' && strcasecmp($filters['cluster'], 'All') !== 0) {
        $conditions[] = 'c.name = :cluster';
        $params['cluster'] = $filters['cluster'];
    }

    if ($filters['school'] !== '' && strcasecmp($filters['school'], 'All') !== 0) {
        $conditions[] = 'sc.name = :school';
        $params['school'] = $filters['school'];
    }

    if ($filters['class_name'] !== '') {
        $conditions[] = 's.class_name = :class_name';
        $params['class_name'] = $filters['class_name'];
    }

    return [
        'sql' => implode(' AND ', $conditions),
        'params' => $params,
    ];
}

function buildAttendanceScope(array $filters): array
{
    $scope = buildStudentScope($filters);

    return [
        'sql' => $scope['sql'] . ' AND mr.monitoring_date BETWEEN :from_date AND :to_date',
        'params' => $scope['params'] + [
            'from_date' => $filters['from_date'],
            'to_date' => $filters['to_date'],
        ],
    ];
}

function createDateSeries(string $fromDate, string $toDate): array
{
    $series = [];
    $cursor = new DateTimeImmutable($fromDate);
    $end = new DateTimeImmutable($toDate);

    while ($cursor <= $end) {
        $series[$cursor->format('Y-m-d')] = [
            'date' => $cursor->format('Y-m-d'),
            'label' => $cursor->format('d M'),
            'present' => 0,
            'absent' => 0,
            'attendance_rate' => 0.0,
        ];
        $cursor = $cursor->modify('+1 day');
    }

    return $series;
}

function hydrateTrendSeries(array $rows, array $series): array
{
    foreach ($rows as $row) {
        $dateKey = (string) $row['attendance_date'];
        if (!isset($series[$dateKey])) {
            continue;
        }

        $present = (int) $row['present_count'];
        $absent = (int) $row['absent_count'];
        $total = $present + $absent;

        $series[$dateKey]['present'] = $present;
        $series[$dateKey]['absent'] = $absent;
        $series[$dateKey]['attendance_rate'] = $total > 0 ? round(($present / $total) * 100, 2) : 0.0;
    }

    return array_values($series);
}

function fetchWorkbookStudentCount(array $filters): int
{
    $cluster = $filters['cluster'];
    if ($cluster === '' || !isset(getWorkbookSchoolDirectory()[$cluster])) {
        return 0;
    }

    $students = loadWorkbookStudentsByCluster()[$cluster] ?? [];

    return count(array_filter(
        $students,
        static function (array $student) use ($filters): bool {
            if ($filters['school'] !== '' && strcasecmp($filters['school'], 'All') !== 0 && $student['school_name'] !== $filters['school']) {
                return false;
            }

            if ($filters['class_name'] !== '' && normalizeWorkbookClassName($student['className']) !== $filters['class_name']) {
                return false;
            }

            return true;
        }
    ));
}

function fetchAttendanceAnalytics(PDO $pdo, array $filters): array
{
    foreach (['students', 'monitoring_reports', 'student_attendance'] as $requiredTable) {
        if (!analyticsTableExists($pdo, $requiredTable)) {
            throw new RuntimeException(
                'Required attendance tables are missing. Import the main schema and save attendance through the teacher portal first.'
            );
        }
    }

    $studentScope = buildStudentScope($filters);
    $attendanceScope = buildAttendanceScope($filters);

    $studentQuery = $pdo->prepare(
        "SELECT s.id, s.full_name, s.class_name
         FROM students s
         INNER JOIN clusters c ON c.id = s.cluster_id
         INNER JOIN schools sc ON sc.id = s.school_id
         WHERE {$studentScope['sql']}"
    );
    $studentQuery->execute($studentScope['params']);
    $totalStudents = count(dedupeAnalyticsStudents(array_map(
        static fn(array $row): array => [
            'id' => (int) $row['id'],
            'student_name' => (string) $row['full_name'],
            'class_name' => (string) $row['class_name'],
        ],
        $studentQuery->fetchAll()
    )));

    if ($totalStudents === 0) {
        $totalStudents = fetchWorkbookStudentCount($filters);
    }

    $attendanceBaseSql =
        " FROM student_attendance sa
          INNER JOIN monitoring_reports mr ON mr.id = sa.report_id
          INNER JOIN students s
            ON (
                (sa.student_id IS NOT NULL AND s.id = sa.student_id)
                OR (
                    sa.student_id IS NULL
                    AND s.school_id = sa.school_id
                    AND s.full_name = sa.student_name
                )
            )
          INNER JOIN clusters c ON c.id = s.cluster_id
          INNER JOIN schools sc ON sc.id = s.school_id
          WHERE {$attendanceScope['sql']}";

    $dailySummaryQuery = $pdo->prepare(
        "SELECT
            COALESCE(SUM(CASE WHEN sa.attendance_status = 'present' THEN 1 ELSE 0 END), 0) AS present_count,
            COALESCE(SUM(CASE WHEN sa.attendance_status = 'absent' THEN 1 ELSE 0 END), 0) AS absent_count"
        . $attendanceBaseSql
        . ' AND mr.monitoring_date = :summary_date'
    );
    $dailySummaryQuery->execute($attendanceScope['params'] + ['summary_date' => $filters['to_date']]);
    $dailySummary = $dailySummaryQuery->fetch() ?: ['present_count' => 0, 'absent_count' => 0];

    $overallSummaryQuery = $pdo->prepare(
        "SELECT
            COALESCE(SUM(CASE WHEN sa.attendance_status = 'present' THEN 1 ELSE 0 END), 0) AS present_count,
            COALESCE(SUM(CASE WHEN sa.attendance_status = 'absent' THEN 1 ELSE 0 END), 0) AS absent_count"
        . $attendanceBaseSql
    );
    $overallSummaryQuery->execute($attendanceScope['params']);
    $overallSummary = $overallSummaryQuery->fetch() ?: ['present_count' => 0, 'absent_count' => 0];

    $weeklyFromDate = max(
        $filters['from_date'],
        (new DateTimeImmutable($filters['to_date']))->modify('-6 days')->format('Y-m-d')
    );

    $weeklyTrendQuery = $pdo->prepare(
        "SELECT
            mr.monitoring_date AS attendance_date,
            SUM(CASE WHEN sa.attendance_status = 'present' THEN 1 ELSE 0 END) AS present_count,
            SUM(CASE WHEN sa.attendance_status = 'absent' THEN 1 ELSE 0 END) AS absent_count"
        . $attendanceBaseSql
        . ' AND mr.monitoring_date >= :weekly_from_date
           GROUP BY mr.monitoring_date
           ORDER BY mr.monitoring_date ASC'
    );
    $weeklyTrendQuery->execute($attendanceScope['params'] + ['weekly_from_date' => $weeklyFromDate]);
    $weeklyTrend = hydrateTrendSeries(
        $weeklyTrendQuery->fetchAll(),
        createDateSeries($weeklyFromDate, $filters['to_date'])
    );

    $monthlyTrendQuery = $pdo->prepare(
        "SELECT
            DATE_FORMAT(mr.monitoring_date, '%Y-%m') AS month_key,
            DATE_FORMAT(mr.monitoring_date, '%b %Y') AS month_label,
            SUM(CASE WHEN sa.attendance_status = 'present' THEN 1 ELSE 0 END) AS present_count,
            SUM(CASE WHEN sa.attendance_status = 'absent' THEN 1 ELSE 0 END) AS absent_count"
        . $attendanceBaseSql
        . " GROUP BY DATE_FORMAT(mr.monitoring_date, '%Y-%m'), DATE_FORMAT(mr.monitoring_date, '%b %Y')
            ORDER BY month_key ASC"
    );
    $monthlyTrendQuery->execute($attendanceScope['params']);
    $monthlyTrend = [];
    foreach ($monthlyTrendQuery->fetchAll() as $row) {
        $present = (int) $row['present_count'];
        $absent = (int) $row['absent_count'];
        $total = $present + $absent;
        $monthlyTrend[] = [
            'month' => $row['month_key'],
            'label' => $row['month_label'],
            'present' => $present,
            'absent' => $absent,
            'attendance_rate' => $total > 0 ? round(($present / $total) * 100, 2) : 0.0,
        ];
    }

    $studentWiseQuery = $pdo->prepare(
        "SELECT
            s.id,
            s.full_name AS student_name,
            s.class_name,
            COALESCE(SUM(CASE WHEN mr.id IS NOT NULL AND sa.attendance_status = 'present' THEN 1 ELSE 0 END), 0) AS present_count,
            COALESCE(SUM(CASE WHEN mr.id IS NOT NULL AND sa.attendance_status = 'absent' THEN 1 ELSE 0 END), 0) AS absent_count,
            COUNT(mr.id) AS total_marked
         FROM students s
         INNER JOIN clusters c ON c.id = s.cluster_id
         INNER JOIN schools sc ON sc.id = s.school_id
         LEFT JOIN student_attendance sa
            ON (sa.student_id = s.id OR (sa.school_id = s.school_id AND sa.student_name = s.full_name))
         LEFT JOIN monitoring_reports mr
            ON mr.id = sa.report_id
            AND mr.monitoring_date BETWEEN :from_date AND :to_date
         WHERE {$studentScope['sql']}
         GROUP BY s.id, s.full_name, s.class_name
         ORDER BY
            CASE
                WHEN COUNT(mr.id) = 0 THEN 0
                ELSE SUM(CASE WHEN mr.id IS NOT NULL AND sa.attendance_status = 'present' THEN 1 ELSE 0 END) / COUNT(mr.id)
            END DESC,
            s.full_name ASC"
    );
    $studentWiseQuery->execute($studentScope['params'] + [
        'from_date' => $filters['from_date'],
        'to_date' => $filters['to_date'],
    ]);

    $studentWiseAttendance = [];
    foreach ($studentWiseQuery->fetchAll() as $row) {
        $present = (int) $row['present_count'];
        $absent = (int) $row['absent_count'];
        $totalMarked = (int) $row['total_marked'];
        $percentage = $totalMarked > 0 ? round(($present / $totalMarked) * 100, 2) : 0.0;

        $studentWiseAttendance[] = [
            'id' => (int) $row['id'],
            'student_name' => $row['student_name'],
            'class_name' => $row['class_name'],
            'present_count' => $present,
            'absent_count' => $absent,
            'attendance_percentage' => $percentage,
            'total_marked' => $totalMarked,
        ];
    }

    $studentWiseAttendance = mergeStudentWiseAttendance($studentWiseAttendance);

    $lowAttendanceAlerts = array_values(array_filter(
        $studentWiseAttendance,
        static fn(array $student): bool => $student['attendance_percentage'] > 0 && $student['attendance_percentage'] < 75
    ));
    usort(
        $lowAttendanceAlerts,
        static fn(array $left, array $right): int => $left['attendance_percentage'] <=> $right['attendance_percentage']
    );

    $subjectWiseAttendance = [];
    if (analyticsTableExists($pdo, 'monitoring_subjects')) {
        $subjectWiseQuery = $pdo->prepare(
            "SELECT
                ms.subject_name,
                SUM(CASE WHEN sa.attendance_status = 'present' THEN 1 ELSE 0 END) AS present_count,
                SUM(CASE WHEN sa.attendance_status = 'absent' THEN 1 ELSE 0 END) AS absent_count,
                COUNT(sa.id) AS total_marked
             FROM monitoring_subjects ms
             INNER JOIN monitoring_reports mr ON mr.id = ms.report_id
             INNER JOIN student_attendance sa ON sa.report_id = mr.id
             INNER JOIN students s ON s.id = sa.student_id
             INNER JOIN clusters c ON c.id = s.cluster_id
             INNER JOIN schools sc ON sc.id = s.school_id
             WHERE {$attendanceScope['sql']}
             GROUP BY ms.subject_name
             ORDER BY ms.subject_name ASC"
        );
        $subjectWiseQuery->execute($attendanceScope['params']);

        foreach ($subjectWiseQuery->fetchAll() as $row) {
            $present = (int) $row['present_count'];
            $absent = (int) $row['absent_count'];
            $total = (int) $row['total_marked'];

            $subjectWiseAttendance[] = [
                'subject_name' => $row['subject_name'],
                'present_count' => $present,
                'absent_count' => $absent,
                'attendance_rate' => $total > 0 ? round(($present / $total) * 100, 2) : 0.0,
            ];
        }
    }

    $rankedStudents = array_values(array_filter(
        $studentWiseAttendance,
        static fn(array $student): bool => $student['present_count'] + $student['absent_count'] > 0
    ));
    usort(
        $rankedStudents,
        static fn(array $left, array $right): int =>
            ($right['attendance_percentage'] <=> $left['attendance_percentage'])
            ?: strcmp($left['student_name'], $right['student_name'])
    );

    $highestAttendance = $rankedStudents[0] ?? null;
    $lowestAttendance = $rankedStudents !== [] ? $rankedStudents[array_key_last($rankedStudents)] : null;

    $overallPresent = (int) $overallSummary['present_count'];
    $overallAbsent = (int) $overallSummary['absent_count'];
    $overallMarked = $overallPresent + $overallAbsent;

    return [
        'filters' => $filters,
        'generated_at' => (new DateTimeImmutable())->format(DATE_ATOM),
        'data_source' => 'monitoring_reports',
        'totals' => [
            'total_students' => $totalStudents,
            'overall_present' => $overallPresent,
            'overall_absent' => $overallAbsent,
            'overall_attendance_percentage' => $overallMarked > 0
                ? round(($overallPresent / $overallMarked) * 100, 2)
                : 0.0,
        ],
        'daily_summary' => [
            'date' => $filters['to_date'],
            'present' => (int) $dailySummary['present_count'],
            'absent' => (int) $dailySummary['absent_count'],
        ],
        'weekly_trend' => $weeklyTrend,
        'monthly_trend' => $monthlyTrend,
        'subject_wise_attendance' => $subjectWiseAttendance,
        'student_wise_attendance' => $studentWiseAttendance,
        'low_attendance_alerts' => $lowAttendanceAlerts,
        'quick_stats' => [
            'highest_attendance' => $highestAttendance,
            'lowest_attendance' => $lowestAttendance,
            'students_below_threshold' => count($lowAttendanceAlerts),
            'threshold_percentage' => 75,
        ],
    ];
}
