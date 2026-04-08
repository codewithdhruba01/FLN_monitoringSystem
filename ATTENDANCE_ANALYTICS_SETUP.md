# Attendance Analytics Setup

1. Import the base project schema if you have not already:
   - `database/fln_monitoring.sql`

2. Import the attendance analytics seed:
   - `database/attendance_analytics.sql`

3. Confirm your XAMPP MySQL credentials in `api/config.php`.

4. Open the dashboard:
   - `http://localhost/FLN_monitoringSystem/dashboard.html`

5. The dashboard will then:
   - call `api/attendance_analytics.php`
   - poll every 3 seconds
   - update stat cards and charts without reload
   - highlight students below 75%
   - export the live dashboard to PDF from the existing `Export PDF` button

## API

`GET /api/attendance_analytics.php`

Supported query params:

- `cluster`
- `school`
- `class`
- `from_date`
- `to_date`

Example:

`/api/attendance_analytics.php?cluster=Halol&school=Abhetlav%20Primary%20School&class=Class%201&from_date=2026-03-18&to_date=2026-03-28`
