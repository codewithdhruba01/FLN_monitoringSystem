<?php

declare(strict_types=1);

require __DIR__ . '/db.php';

function normalizeMonitoringStudentName(string $value): string
{
    return strtolower(trim(preg_replace('/\s+/', ' ', $value) ?? ''));
}

function assertUniqueStudentRows(array $rows, string $fieldName): void
{
    $seen = [];

    foreach ($rows as $index => $row) {
        $studentName = trim((string) ($row['name'] ?? ''));
        if ($studentName === '') {
            continue;
        }

        $key = normalizeMonitoringStudentName($studentName);
        if (isset($seen[$key])) {
            throw new RuntimeException(
                sprintf(
                    'Duplicate student "%s" found in %s. Refresh the teacher portal and submit again.',
                    $studentName,
                    $fieldName
                )
            );
        }

        $seen[$key] = $index;
    }
}

function normalizeOptionalInteger($value, int $default = 0): int
{
    if ($value === '' || $value === null) {
        return $default;
    }

    return (int) $value;
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendJson([
            'success' => false,
            'message' => 'POST method required.',
        ], 405);
    }

    $data = readJsonRequest();

    $required = [
        'cluster',
        'school',
        'teacherId',
        'grade',
        'date',
        'studentsPresent',
        'boysPresent',
        'girlsPresent',
        'flnPeriod',
        'duration',
        'engagement',
        'mainTopic',
        'literacyFocus',
        'literacyConcept',
        'numeracyFocus',
        'numeracyConcept',
    ];

    foreach ($required as $field) {
        if (in_array($field, ['boysPresent', 'girlsPresent'], true) && (($data[$field] ?? null) === '' || ($data[$field] ?? null) === null)) {
            $data[$field] = 0;
        }

        if (!array_key_exists($field, $data) || $data[$field] === '' || $data[$field] === null) {
            sendJson([
                'success' => false,
                'message' => "Missing required field: {$field}",
            ], 422);
        }
    }

    assertUniqueStudentRows($data['studentPerformance'] ?? [], 'student performance');
    assertUniqueStudentRows($data['studentAttendance'] ?? [], 'student attendance');

    $pdo = getDatabaseConnection();
    $pdo->beginTransaction();

    $schoolLookup = $pdo->prepare(
        'SELECT s.id AS school_id, c.id AS cluster_id
         FROM schools s
         INNER JOIN clusters c ON c.id = s.cluster_id
         WHERE c.name = :cluster AND s.name = :school
         LIMIT 1'
    );
    $schoolLookup->execute([
        'cluster' => $data['cluster'],
        'school' => $data['school'],
    ]);
    $school = $schoolLookup->fetch();

    if (!$school) {
        throw new RuntimeException('Selected school does not exist in the database.');
    }

    $studentIdLookup = $pdo->prepare(
        'SELECT id
         FROM students
         WHERE school_id = :school_id'
    );
    $studentIdLookup->execute([
        'school_id' => (int) $school['school_id'],
    ]);
    $validStudentIds = [];
    foreach ($studentIdLookup->fetchAll(PDO::FETCH_COLUMN) as $studentId) {
        $validStudentIds[(int) $studentId] = true;
    }

    $sanitizeStudentId = static function ($studentId) use ($validStudentIds): ?int {
        if (empty($studentId)) {
            return null;
        }

        $normalizedStudentId = (int) $studentId;
        return isset($validStudentIds[$normalizedStudentId]) ? $normalizedStudentId : null;
    };

    $insertReport = $pdo->prepare(
        'INSERT INTO monitoring_reports (
            cluster_id,
            school_id,
            teacher_id,
            grade_name,
            section_name,
            monitoring_date,
            students_present,
            boys_present,
            girls_present,
            fln_period_happened,
            fln_not_happened_reason,
            instruction_duration_minutes,
            engagement_level,
            main_topic,
            literacy_focus,
            literacy_concept,
            numeracy_focus,
            numeracy_concept,
            remarks
         ) VALUES (
            :cluster_id,
            :school_id,
            :teacher_id,
            :grade_name,
            :section_name,
            :monitoring_date,
            :students_present,
            :boys_present,
            :girls_present,
            :fln_period_happened,
            :fln_not_happened_reason,
            :instruction_duration_minutes,
            :engagement_level,
            :main_topic,
            :literacy_focus,
            :literacy_concept,
            :numeracy_focus,
            :numeracy_concept,
            :remarks
         )'
    );

    $insertReport->execute([
        'cluster_id' => (int) $school['cluster_id'],
        'school_id' => (int) $school['school_id'],
        'teacher_id' => (int) $data['teacherId'],
        'grade_name' => $data['grade'],
        'section_name' => $data['section'] ?? '',
        'monitoring_date' => $data['date'],
        'students_present' => normalizeOptionalInteger($data['studentsPresent']),
        'boys_present' => normalizeOptionalInteger($data['boysPresent']),
        'girls_present' => normalizeOptionalInteger($data['girlsPresent']),
        'fln_period_happened' => $data['flnPeriod'] === 'yes' ? 1 : 0,
        'fln_not_happened_reason' => $data['reason'] ?: null,
        'instruction_duration_minutes' => (int) $data['duration'],
        'engagement_level' => $data['engagement'],
        'main_topic' => $data['mainTopic'],
        'literacy_focus' => $data['literacyFocus'],
        'literacy_concept' => $data['literacyConcept'],
        'numeracy_focus' => $data['numeracyFocus'],
        'numeracy_concept' => $data['numeracyConcept'],
        'remarks' => $data['remarks'] ?? null,
    ]);

    $reportId = (int) $pdo->lastInsertId();

    $insertMaterial = $pdo->prepare(
        'INSERT INTO monitoring_materials (report_id, cluster_id, school_id, material_name) VALUES (:report_id, :cluster_id, :school_id, :material_name)'
    );
    foreach (($data['materials'] ?? []) as $material) {
        $insertMaterial->execute([
            'report_id' => $reportId,
            'cluster_id' => (int) $school['cluster_id'],
            'school_id' => (int) $school['school_id'],
            'material_name' => $material,
        ]);
    }

    $insertSubject = $pdo->prepare(
        'INSERT INTO monitoring_subjects (report_id, cluster_id, school_id, subject_name) VALUES (:report_id, :cluster_id, :school_id, :subject_name)'
    );
    foreach (($data['subjects'] ?? []) as $subject) {
        $insertSubject->execute([
            'report_id' => $reportId,
            'cluster_id' => (int) $school['cluster_id'],
            'school_id' => (int) $school['school_id'],
            'subject_name' => $subject,
        ]);
    }

    $insertPerformance = $pdo->prepare(
        'INSERT INTO student_performance (
            report_id,
            cluster_id,
            school_id,
            student_id,
            student_number,
            student_name,
            performance_level,
            needs_support
         ) VALUES (
            :report_id,
            :cluster_id,
            :school_id,
            :student_id,
            :student_number,
            :student_name,
            :performance_level,
            :needs_support
         )'
    );
    foreach (($data['studentPerformance'] ?? []) as $studentPerformance) {
        $insertPerformance->execute([
            'report_id' => $reportId,
            'cluster_id' => (int) $school['cluster_id'],
            'school_id' => (int) $school['school_id'],
            'student_id' => $sanitizeStudentId($studentPerformance['studentId'] ?? null),
            'student_number' => (int) $studentPerformance['studentNumber'],
            'student_name' => $studentPerformance['name'],
            'performance_level' => (int) $studentPerformance['performanceLevel'],
            'needs_support' => !empty($studentPerformance['needsSupport']) ? 1 : 0,
        ]);
    }

    $insertAttendance = $pdo->prepare(
        'INSERT INTO student_attendance (
            report_id,
            cluster_id,
            school_id,
            student_id,
            student_number,
            student_name,
            attendance_status
         ) VALUES (
            :report_id,
            :cluster_id,
            :school_id,
            :student_id,
            :student_number,
            :student_name,
            :attendance_status
         )'
    );
    foreach (($data['studentAttendance'] ?? []) as $studentAttendance) {
        $insertAttendance->execute([
            'report_id' => $reportId,
            'cluster_id' => (int) $school['cluster_id'],
            'school_id' => (int) $school['school_id'],
            'student_id' => $sanitizeStudentId($studentAttendance['studentId'] ?? null),
            'student_number' => (int) $studentAttendance['studentNumber'],
            'student_name' => $studentAttendance['name'],
            'attendance_status' => $studentAttendance['attendanceStatus'],
        ]);
    }

    $pdo->commit();

    sendJson([
        'success' => true,
        'message' => 'Monitoring report saved to the XAMPP MySQL database.',
        'data' => [
            'reportId' => $reportId,
        ],
    ]);
} catch (Throwable $exception) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    sendJson([
        'success' => false,
        'message' => $exception->getMessage(),
    ], 500);
}
