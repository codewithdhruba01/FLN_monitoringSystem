<?php

declare(strict_types=1);

require __DIR__ . '/db.php';
require __DIR__ . '/workbook_data.php';

function normalizeContextStudentName(string $value): string
{
    return strtolower(trim(preg_replace('/\s+/', ' ', $value) ?? ''));
}

function buildContextStudentIdentity(array $student): string
{
    $className = normalizeWorkbookClassName((string) ($student['class_name'] ?? $student['className'] ?? ''));

    return normalizeContextStudentName((string) ($student['name'] ?? ''))
        . '|'
        . strtolower($className);
}

function shouldReplaceContextStudent(array $current, array $candidate): bool
{
    $currentClass = normalizeWorkbookClassName((string) ($current['className'] ?? $current['class_name'] ?? ''));
    $candidateClass = normalizeWorkbookClassName((string) ($candidate['className'] ?? $candidate['class_name'] ?? ''));

    if ($currentClass !== $candidateClass && str_starts_with($candidateClass, 'Class ')) {
        return true;
    }

    return (int) ($candidate['id'] ?? 0) > (int) ($current['id'] ?? 0);
}

function dedupeContextStudents(array $students): array
{
    $uniqueStudents = [];

    foreach ($students as $student) {
        $student['className'] = normalizeWorkbookClassName((string) ($student['className'] ?? $student['class_name'] ?? ''));
        $key = buildContextStudentIdentity($student);

        if (!isset($uniqueStudents[$key]) || shouldReplaceContextStudent($uniqueStudents[$key], $student)) {
            $uniqueStudents[$key] = $student;
        }
    }

    uasort(
        $uniqueStudents,
        static fn(array $left, array $right): int =>
            strcmp((string) $left['className'], (string) $right['className'])
            ?: strcmp((string) $left['name'], (string) $right['name'])
    );

    return array_values($uniqueStudents);
}

try {
    $clusterName = trim($_GET['cluster'] ?? '');
    $schoolName = trim($_GET['school'] ?? '');

    if ($clusterName === '' || $schoolName === '') {
        sendJson([
            'success' => false,
            'message' => 'Cluster and school are required.',
        ], 422);
    }

    $workbookContext = getWorkbookSchoolContext($clusterName, $schoolName);

    try {
        $pdo = getDatabaseConnection();

        $schoolStatement = $pdo->prepare(
            'SELECT s.id AS school_id, s.name AS school_name, c.id AS cluster_id, c.name AS cluster_name
             FROM schools s
             INNER JOIN clusters c ON c.id = s.cluster_id
             WHERE c.name = :cluster AND s.name = :school
             LIMIT 1'
        );
        $schoolStatement->execute([
            'cluster' => $clusterName,
            'school' => $schoolName,
        ]);
        $school = $schoolStatement->fetch();

        if ($school === false && $workbookContext !== null) {
            sendJson([
                'success' => true,
                'data' => $workbookContext,
            ]);
        }

        if ($school === false) {
            sendJson([
                'success' => false,
                'message' => 'School not found.',
            ], 404);
        }

        $teacherStatement = $pdo->prepare(
            'SELECT id, full_name AS name
             FROM teachers
             WHERE cluster_id = :cluster_id AND is_active = 1
             ORDER BY full_name'
        );
        $teacherStatement->execute(['cluster_id' => $school['cluster_id']]);

        $studentStatement = $pdo->prepare(
            'SELECT id, full_name AS name, class_name, gender
             FROM students
             WHERE school_id = :school_id AND is_active = 1
             ORDER BY full_name'
        );
        $studentStatement->execute(['school_id' => $school['school_id']]);

        $teachers = array_map(
            static fn(array $teacher): array => [
                'id' => (int) $teacher['id'],
                'name' => $teacher['name'],
            ],
            $teacherStatement->fetchAll()
        );

        $students = array_map(
            static fn(array $student): array => [
                'id' => (int) $student['id'],
                'name' => $student['name'],
                'className' => normalizeWorkbookClassName($student['class_name']),
                'gender' => $student['gender'] ?: '',
            ],
            $studentStatement->fetchAll()
        );

        $students = dedupeContextStudents($students);

        if ($workbookContext !== null) {
            if ($teachers === []) {
                $teachers = $workbookContext['teachers'];
            }

            if ($students === []) {
                $students = dedupeContextStudents($workbookContext['students']);
            }
        }

        sendJson([
            'success' => true,
            'data' => [
                'cluster' => [
                    'id' => (int) $school['cluster_id'],
                    'name' => $school['cluster_name'],
                ],
                'school' => [
                    'id' => (int) $school['school_id'],
                    'name' => $school['school_name'],
                ],
                'teachers' => $teachers,
                'students' => $students,
            ],
        ]);
    } catch (Throwable $databaseException) {
        if ($workbookContext !== null) {
            sendJson([
                'success' => true,
                'data' => $workbookContext,
            ]);
        }

        throw $databaseException;
    }
} catch (Throwable $exception) {
    sendJson([
        'success' => false,
        'message' => $exception->getMessage(),
    ], 500);
}
