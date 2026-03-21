<?php

declare(strict_types=1);

require __DIR__ . '/db.php';

try {
    $clusterName = trim($_GET['cluster'] ?? '');

    if ($clusterName === '') {
        sendJson([
            'success' => false,
            'message' => 'Cluster is required.',
        ], 422);
    }

    $pdo = getDatabaseConnection();
    $statement = $pdo->prepare(
        'SELECT s.id, s.name
         FROM schools s
         INNER JOIN clusters c ON c.id = s.cluster_id
         WHERE c.name = :cluster
         ORDER BY s.name'
    );
    $statement->execute(['cluster' => $clusterName]);

    sendJson([
        'success' => true,
        'data' => [
            'schools' => $statement->fetchAll(),
        ],
    ]);
} catch (Throwable $exception) {
    sendJson([
        'success' => false,
        'message' => $exception->getMessage(),
    ], 500);
}
