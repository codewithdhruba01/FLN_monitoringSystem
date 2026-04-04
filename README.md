# FLN Daily Monitoring System

![FLN Monitoring Cover](assets/FLN%20Monitoring.png)

A responsive multi-page web application for recording foundational literacy and numeracy (FLN) monitoring data.

---

## Project Overview

The **FLN Daily Monitoring System** helps teams record daily FLN class monitoring across clusters and schools.

**Key Features**
- Multi-page navigation with URL parameters
- Responsive HTML, CSS, and vanilla JavaScript frontend
- PHP + MySQL integration for school context and report saving
- Workbook-backed fallback data for school, teacher, and student loading
- Form validation with guided error states
- Student attendance and performance tracking
- Accessibility-minded UI and mobile-friendly layouts

---

## Project Structure

```text
FLN_monitoringSystem/
|-- cluster.html
|-- schools.html
|-- class-progress.html
|-- help-center.html
|-- teacher-portal.html
|-- index.html
|-- styles.css
|-- script.js
|-- api/
|   |-- config.php
|   |-- db.php
|   |-- get_schools.php
|   |-- get_school_context.php
|   `-- save_monitoring.php
|-- database/
|   |-- complete_migration.sql
|   `-- sync_workbook_data.php
`-- Students List Maval, Halol.xlsx
```

---

## How It Works

1. The user selects a cluster.
2. The user selects a school.
3. The class monitoring form loads teachers and students.
4. The form submits to PHP and saves to MySQL when the database is configured.

If the database is unavailable, the app still uses fallback school data where possible, and submitted reports are stored in the current browser as a temporary backup instead of failing completely.

---

## Setup

1. Copy the project to `C:\xampp\htdocs\FLN_monitoringSystem`
2. Start `Apache` and `MySQL` in XAMPP
3. Import `database/complete_migration.sql` into phpMyAdmin
4. Run:

```powershell
cd C:\xampp\htdocs\FLN_monitoringSystem
C:\xampp\php\php.exe database\sync_workbook_data.php
```

5. Open:

```text
http://localhost/FLN_monitoringSystem/cluster.html
```

If MySQL uses different credentials on that machine, update `api/config.php` before running the sync step.

---

## Data Handling

- School and student context is requested through PHP endpoints
- Reports are saved to MySQL when the backend is available
- Failed database saves are backed up in browser storage
- Form payloads are also visible in the browser console for debugging

---

## Notes

- This project is no longer frontend-only
- Sharing the folder alone is not enough for full functionality
- For full use on another machine, XAMPP, MySQL setup, database import, and workbook sync must all be completed

---

## Status

Shareable after setup, with browser-side fallback if the database is temporarily unavailable.
