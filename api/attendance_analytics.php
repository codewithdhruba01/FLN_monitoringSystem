<?php

declare(strict_types=1);

require __DIR__ . '/db.php';
require __DIR__ . '/attendance_analytics_service.php';

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        sendJson([
            'success' => false,
            'message' => 'GET method required.',
        ], 405);
    }

    $filters = normalizeAnalyticsFilters($_GET);
    $analytics = fetchAttendanceAnalytics(getDatabaseConnection(), $filters);

    sendJson([
        'success' => true,
        'data' => $analytics,
    ]);
} catch (Throwable $exception) {
    sendJson([
        'success' => false,
        'message' => $exception->getMessage(),
    ], 500);
}
