<?php

declare(strict_types=1);

require __DIR__ . '/db.php';
require __DIR__ . '/attendance_analytics_service.php';

$tcpdfCandidates = [
    __DIR__ . '/../tcpdf/tcpdf.php',
    __DIR__ . '/../TCPDF-main/tcpdf.php',
    __DIR__ . '/../vendor/tecnickcom/tcpdf/tcpdf.php',
    'C:/xampp/htdocs/tcpdf/tcpdf.php',
];

$tcpdfPath = null;

foreach ($tcpdfCandidates as $candidate) {
    if (is_file($candidate)) {
        $tcpdfPath = $candidate;
        break;
    }
}

if ($tcpdfPath === null) {
    http_response_code(500);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Classic TCPDF not found. Install it in /FLN_monitoringSystem/tcpdf/ or /FLN_monitoringSystem/TCPDF-main/.';
    exit;
}

require_once $tcpdfPath;

function pdfEscape(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}

try {
    $pdo = getDatabaseConnection();
    $filters = normalizeAnalyticsFilters($_GET);
    $analytics = fetchAttendanceAnalytics($pdo, $filters);

    $studentScope = buildStudentScope($filters);
    $attendanceScope = buildAttendanceScope($filters);

    $teacherQuery = $pdo->prepare(
        "SELECT DISTINCT t.full_name
         FROM monitoring_reports mr
         INNER JOIN teachers t ON t.id = mr.teacher_id
         INNER JOIN schools sc ON sc.id = mr.school_id
         INNER JOIN clusters c ON c.id = mr.cluster_id
         WHERE mr.monitoring_date BETWEEN :from_date AND :to_date"
        . ($filters['cluster'] !== '' && strcasecmp($filters['cluster'], 'All') !== 0 ? ' AND c.name = :cluster' : '')
        . ($filters['school'] !== '' && strcasecmp($filters['school'], 'All') !== 0 ? ' AND sc.name = :school' : '')
        . ' ORDER BY t.full_name ASC'
    );

    $teacherParams = [
        'from_date' => $filters['from_date'],
        'to_date' => $filters['to_date'],
    ];

    if ($filters['cluster'] !== '' && strcasecmp($filters['cluster'], 'All') !== 0) {
        $teacherParams['cluster'] = $filters['cluster'];
    }

    if ($filters['school'] !== '' && strcasecmp($filters['school'], 'All') !== 0) {
        $teacherParams['school'] = $filters['school'];
    }

    $teacherQuery->execute($teacherParams);
    $teacherNames = array_values(array_filter(array_map('strval', $teacherQuery->fetchAll(PDO::FETCH_COLUMN))));
    $teacherLabel = $teacherNames !== [] ? implode(', ', $teacherNames) : 'N/A';

    $performanceRows = [];
    if (analyticsTableExists($pdo, 'student_performance')) {
        $performanceQuery = $pdo->prepare(
            "SELECT
                s.id,
                s.full_name AS student_name,
                s.class_name,
                ROUND(AVG(sp.performance_level), 2) AS average_performance,
                SUM(CASE WHEN sp.needs_support = 1 THEN 1 ELSE 0 END) AS support_count
             FROM student_performance sp
             INNER JOIN monitoring_reports mr ON mr.id = sp.report_id
             INNER JOIN students s
                ON (
                    (sp.student_id IS NOT NULL AND s.id = sp.student_id)
                    OR (
                        sp.student_id IS NULL
                        AND s.school_id = sp.school_id
                        AND s.full_name = sp.student_name
                    )
                )
             INNER JOIN clusters c ON c.id = s.cluster_id
             INNER JOIN schools sc ON sc.id = s.school_id
             WHERE {$attendanceScope['sql']}
             GROUP BY s.id, s.full_name, s.class_name
             ORDER BY s.class_name ASC, s.full_name ASC"
        );
        $performanceQuery->execute($attendanceScope['params']);
        $performanceRows = $performanceQuery->fetchAll();
    }

    $pdf = new TCPDF('L', PDF_UNIT, 'A4', true, 'UTF-8', false);
    $pdf->SetCreator('FLN Monitoring System');
    $pdf->SetAuthor('FLN Monitoring System');
    $pdf->SetTitle('Attendance Dashboard Report');
    $pdf->SetMargins(10, 10, 10);
    $pdf->SetAutoPageBreak(true, 10);
    $pdf->setPrintHeader(false);
    $pdf->setPrintFooter(false);
    $pdf->AddPage();
    $pdf->SetFont('helvetica', '', 9);

    $filtersLabel = [
        'Cluster' => $analytics['filters']['cluster'] !== '' ? $analytics['filters']['cluster'] : 'All Clusters',
        'School' => $analytics['filters']['school'] !== '' ? $analytics['filters']['school'] : 'All Schools',
        'Class' => $analytics['filters']['class_name'] !== '' ? $analytics['filters']['class_name'] : 'All Classes',
        'From Date' => $analytics['filters']['from_date'],
        'To Date' => $analytics['filters']['to_date'],
    ];

    $html = '
        <style>
            .title {
                text-align: center;
                font-size: 14pt;
                font-weight: bold;
            }
            .meta-table, .summary-table, .students-table, .subjects-table {
                border-collapse: collapse;
                width: 100%;
            }
            .meta-table td, .summary-table td, .summary-table th,
            .students-table td, .students-table th, .subjects-table td, .subjects-table th {
                border: 1px solid #000000;
                padding: 5px;
                font-size: 8pt;
            }
            .summary-table th, .students-table th, .subjects-table th {
                background-color: #f2f2f2;
                font-weight: bold;
                text-align: center;
            }
            .section {
                font-size: 10pt;
                font-weight: bold;
                margin: 8px 0 4px;
            }
            .center {
                text-align: center;
            }
            .left {
                text-align: left;
            }
        </style>
        <div class="title">Attendance Dashboard Report</div>
        <br>
        <table class="meta-table">
            <tr>
                <td width="20%"><b>Generated At</b></td>
                <td width="30%">' . pdfEscape(date('Y-m-d H:i:s')) . '</td>
                <td width="20%"><b>Data Source</b></td>
                <td width="30%">XAMPP / MySQL</td>
            </tr>
            <tr>
                <td width="20%"><b>Cluster</b></td>
                <td width="30%">' . pdfEscape($filtersLabel['Cluster']) . '</td>
                <td width="20%"><b>Teacher</b></td>
                <td width="30%">' . pdfEscape($teacherLabel) . '</td>
            </tr>
            <tr>
                <td width="20%"><b>School</b></td>
                <td width="30%">' . pdfEscape($filtersLabel['School']) . '</td>
                <td width="20%"><b>Class</b></td>
                <td width="30%">' . pdfEscape($filtersLabel['Class']) . '</td>
            </tr>
            <tr>
                <td width="20%"><b>Date Range</b></td>
                <td width="30%">' . pdfEscape($filtersLabel['From Date'] . ' to ' . $filtersLabel['To Date']) . '</td>
                <td width="20%"><b>Generated At</b></td>
                <td width="30%">' . pdfEscape(date('Y-m-d H:i:s')) . '</td>
            </tr>
        </table>

        <div class="section">Summary</div>
        <table class="summary-table">
            <tr>
                <th width="20%">Total Students</th>
                <th width="20%">Overall Present</th>
                <th width="20%">Overall Absent</th>
                <th width="20%">Attendance %</th>
                <th width="20%">Below Threshold</th>
            </tr>
            <tr>
                <td class="center">' . pdfEscape((string) $analytics['totals']['total_students']) . '</td>
                <td class="center">' . pdfEscape((string) $analytics['totals']['overall_present']) . '</td>
                <td class="center">' . pdfEscape((string) $analytics['totals']['overall_absent']) . '</td>
                <td class="center">' . pdfEscape((string) $analytics['totals']['overall_attendance_percentage']) . '%</td>
                <td class="center">' . pdfEscape((string) $analytics['quick_stats']['students_below_threshold']) . '</td>
            </tr>
        </table>

        <div class="section">Student Attendance</div>
        <table class="students-table">
            <tr>
                <th width="6%">#</th>
                <th width="34%">Student Name</th>
                <th width="18%">Class</th>
                <th width="14%">Present</th>
                <th width="14%">Absent</th>
                <th width="14%">Attendance %</th>
            </tr>';

    $students = $analytics['student_wise_attendance'] ?? [];
    if ($students === []) {
        $html .= '
            <tr>
                <td colspan="6" class="center">No student attendance records found for the selected dashboard filters.</td>
            </tr>';
    } else {
        $index = 1;
        foreach ($students as $student) {
            $html .= '
                <tr>
                    <td class="center">' . pdfEscape((string) $index) . '</td>
                    <td class="left">' . pdfEscape((string) $student['student_name']) . '</td>
                    <td class="center">' . pdfEscape((string) ($student['class_name'] ?: 'Unassigned')) . '</td>
                    <td class="center">' . pdfEscape((string) $student['present_count']) . '</td>
                    <td class="center">' . pdfEscape((string) $student['absent_count']) . '</td>
                    <td class="center">' . pdfEscape((string) $student['attendance_percentage']) . '%</td>
                </tr>';
            $index++;
        }
    }

    $html .= '
        </table>';

    $subjects = $analytics['subject_wise_attendance'] ?? [];
    if ($subjects !== []) {
        $html .= '
            <div class="section">Subject-wise Attendance</div>
            <table class="subjects-table">
                <tr>
                    <th width="40%">Subject</th>
                    <th width="20%">Present</th>
                    <th width="20%">Absent</th>
                    <th width="20%">Attendance %</th>
                </tr>';

        foreach ($subjects as $subject) {
            $html .= '
                <tr>
                    <td class="left">' . pdfEscape((string) $subject['subject_name']) . '</td>
                    <td class="center">' . pdfEscape((string) $subject['present_count']) . '</td>
                    <td class="center">' . pdfEscape((string) $subject['absent_count']) . '</td>
                    <td class="center">' . pdfEscape((string) $subject['attendance_rate']) . '%</td>
                </tr>';
        }

        $html .= '</table>';
    }

    $html .= '
        <div class="section">Student Performance</div>
        <table class="students-table">
            <tr>
                <th width="6%">#</th>
                <th width="38%">Student Name</th>
                <th width="18%">Class</th>
                <th width="18%">Avg Performance</th>
                <th width="20%">Needs Support Count</th>
            </tr>';

    if ($performanceRows === []) {
        $html .= '
            <tr>
                <td colspan="5" class="center">No student performance records found for the selected dashboard filters.</td>
            </tr>';
    } else {
        $index = 1;
        foreach ($performanceRows as $performance) {
            $html .= '
                <tr>
                    <td class="center">' . pdfEscape((string) $index) . '</td>
                    <td class="left">' . pdfEscape((string) $performance['student_name']) . '</td>
                    <td class="center">' . pdfEscape((string) ($performance['class_name'] ?: 'Unassigned')) . '</td>
                    <td class="center">' . pdfEscape((string) $performance['average_performance']) . '</td>
                    <td class="center">' . pdfEscape((string) $performance['support_count']) . '</td>
                </tr>';
            $index++;
        }
    }

    $html .= '</table>';

    $pdf->writeHTML($html, true, false, true, false, '');
    $pdf->Output('attendance_dashboard_report.pdf', 'I');
} catch (Throwable $exception) {
    http_response_code(500);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'PDF export failed: ' . $exception->getMessage();
}
