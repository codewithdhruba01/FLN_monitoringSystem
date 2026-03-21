<?php

declare(strict_types=1);

require __DIR__ . '/db.php';

try {
    $clusterName = trim($_GET['cluster'] ?? '');
    $schoolName = trim($_GET['school'] ?? '');

    if ($clusterName === '' || $schoolName === '') {
        sendJson([
            'success' => false,
            'message' => 'Cluster and school are required.',
        ], 422);
    }

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

    if (!$school) {
        sendJson([
            'success' => false,
            'message' => 'School not found in database.',
        ], 404);
    }

    $teacherStatement = $pdo->prepare(
        'SELECT id, full_name AS name
         FROM teachers
         WHERE school_id = :school_id AND is_active = 1
         ORDER BY full_name'
    );
    $teacherStatement->execute(['school_id' => $school['school_id']]);

    $studentStatement = $pdo->prepare(
        'SELECT id, full_name AS name
         FROM students
         WHERE school_id = :school_id AND is_active = 1
         ORDER BY full_name'
    );
    $studentStatement->execute(['school_id' => $school['school_id']]);

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
            'teachers' => array_map(
                static fn(array $teacher): array => [
                    'id' => (int) $teacher['id'],
                    'name' => $teacher['name'],
                ],
                $teacherStatement->fetchAll()
            ),
            'students' => array_map(
                static fn(array $student): array => [
                    'id' => (int) $student['id'],
                    'name' => $student['name'],
                ],
                $studentStatement->fetchAll()
            ),
        ],
    ]);
} catch (Throwable $exception) {
    sendJson([
        'success' => false,
        'message' => $exception->getMessage(),
    ], 500);
}
