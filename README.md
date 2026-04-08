# FLN Daily Monitoring System
## Space ECE India Foundation

A multi-page FLN monitoring website built with HTML, CSS, vanilla JavaScript, PHP, MySQL, and TCPDF for XAMPP-based local deployment.

---

## Overview

The project helps teams:
- select cluster and school
- load teacher and student context
- record daily FLN monitoring data
- save attendance and performance records to MySQL
- view analytics on the dashboard
- export filtered attendance reports to PDF from the dashboard

---

## Final Website Flow

1. Open the landing page or go directly to the workflow pages through `localhost`.
2. Select a cluster on `cluster.html`.
3. Select a school on `schools.html`.
4. Fill and submit the monitoring form on `class-progress.html`.
5. Submitted data is saved into XAMPP MySQL through the PHP API.
6. Open `dashboard.html` to review attendance analytics.
7. Use the dashboard filters and click `Export PDF` to generate the PDF from MySQL data through TCPDF.

---

## Main Features

- Multi-page FLN workflow
- Responsive UI for desktop and mobile
- PHP + MySQL backend integration
- Teacher, school, and student context loading
- Student attendance tracking
- Student performance tracking
- Dashboard analytics with filters
- PDF export from dashboard using TCPDF
- Browser fallback support where some context data can still load if backend data is missing

---

## Project Structure

```text
FLN_monitoringSystem/
|-- index.html
|-- cluster.html
|-- schools.html
|-- class-progress.html
|-- dashboard.html
|-- help-center.html
|-- teacher-portal.html
|-- script.js
|-- dashboard.js
|-- styles.css
|-- api/
|   |-- attendance_analytics.php
|   |-- attendance_analytics_service.php
|   |-- config.php
|   |-- db.php
|   |-- export_attendance_pdf.php
|   |-- get_school_context.php
|   |-- get_schools.php
|   |-- save_monitoring.php
|   `-- workbook_data.php
|-- database/
|   |-- attendance_analytics.sql
|   |-- complete_migration.sql
|   |-- fln_monitoring.sql
|   `-- sync_workbook_data.php
|-- assets/
|-- TCPDF-main/
`-- Students List Maval, Halol.xlsx
```

---

## Setup

1. Copy the project into:

```text
C:\xampp\htdocs\FLN_monitoringSystem
```

2. Start `Apache` and `MySQL` from XAMPP.

3. Import the main schema into phpMyAdmin:

```text
database/fln_monitoring.sql
```

4. If needed, also import the attendance analytics seed:

```text
database/attendance_analytics.sql
```

5. Check database credentials in:

```text
api/config.php
```

6. Sync workbook-backed data:

```powershell
cd C:\xampp\htdocs\FLN_monitoringSystem
C:\xampp\php\php.exe database\sync_workbook_data.php
```

7. Make sure classic TCPDF exists here:

```text
C:\xampp\htdocs\FLN_monitoringSystem\TCPDF-main\tcpdf.php
```

8. Open the app:

```text
http://localhost/FLN_monitoringSystem/index.html
```

---

## Important URLs

- Landing page:
  `http://localhost/FLN_monitoringSystem/index.html`
- Cluster page:
  `http://localhost/FLN_monitoringSystem/cluster.html`
- Class progress form:
  `http://localhost/FLN_monitoringSystem/class-progress.html`
- Dashboard:
  `http://localhost/FLN_monitoringSystem/dashboard.html`

---

## Dashboard Export

The dashboard export is now server-side.

- The dashboard filter form sends `cluster`, `school`, `class`, `from_date`, and `to_date`
- The backend reads filtered attendance data from MySQL
- PDF generation happens in:
  [api/export_attendance_pdf.php](/c:/xampp/htdocs/FLN_monitoringSystem/api/export_attendance_pdf.php)
- The PDF opens in the browser instead of forcing download

The exported PDF currently includes:
- selected filter details
- teacher name(s) found in the filtered reports
- attendance summary
- student attendance table
- subject-wise attendance table when available
- student performance table

---

## Data Handling

- School and teacher context is loaded through PHP endpoints
- Monitoring reports are saved to MySQL
- Attendance data is used by the analytics dashboard
- Student performance data is stored separately and included in the PDF export
- If database writes fail, the monitoring form stores a temporary browser backup

---

## Notes

- Open the site through `http://localhost/...`, not `file:///...`
- The PDF export depends on Apache, PHP, MySQL, and TCPDF
- Deleting `TCPDF-main` will break PDF export
- The `_edge_tmp` browser cache folder is not part of the project and has already been removed

---

## Status

Current final state:
- monitoring form saves to XAMPP MySQL
- dashboard reads analytics from MySQL
- dashboard exports filtered attendance PDF through TCPDF
- frontend pages have had a basic performance optimization pass for smoother loading
