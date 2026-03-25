# Setup For Others

This guide explains how to run the FLN Monitoring System after receiving the project zip.

## Requirements

- XAMPP installed
- `Apache` started
- `MySQL` started
- Project folder extracted inside `C:\xampp\htdocs\`

Example project path:

```text
C:\xampp\htdocs\FLN_monitoringSystem
```

## 1. Place the project correctly

Extract or copy the project folder into:

```text
C:\xampp\htdocs\
```

The final path should look like:

```text
C:\xampp\htdocs\FLN_monitoringSystem
```

## 2. Start XAMPP services

Open the XAMPP Control Panel and start:

- `Apache`
- `MySQL`

## 3. Create and import the database

Open `phpMyAdmin` in your browser:

```text
http://localhost/phpmyadmin
```

Then:

1. Click `Import`
2. Choose the file [database/complete_migration.sql](/c:/xampp/htdocs/FLN_monitoringSystem/database/complete_migration.sql)
3. Click `Go`

This will create the database:

```text
fln_monitoring
```

## 4. Sync the workbook student data

Make sure this Excel file is present in the project root:

- [Students List Maval, Halol.xlsx](/c:/xampp/htdocs/FLN_monitoringSystem/Students%20List%20Maval,%20Halol.xlsx)

Then open `Command Prompt` or `PowerShell` and run:

```powershell
cd C:\xampp\htdocs\FLN_monitoringSystem
C:\xampp\php\php.exe database\sync_workbook_data.php
```

If it works, you should see:

```text
Workbook data synced successfully.
```

## 5. Open the project

Open this URL in the browser:

```text
http://localhost/FLN_monitoringSystem/cluster.html
```

## Database Settings

The app uses [api/config.php](/c:/xampp/htdocs/FLN_monitoringSystem/api/config.php).

Default values:

- host: `127.0.0.1`
- port: `3306`
- database: `fln_monitoring`
- username: `root`
- password: empty

If the other person has a different MySQL username or password, they should update that file.

## If Something Does Not Work

Check these first:

- `Apache` is running in XAMPP
- `MySQL` is running in XAMPP
- the database `fln_monitoring` exists
- the workbook file is still in the project root
- the project folder name is exactly `FLN_monitoringSystem`

## Quick Setup Summary

1. Copy folder to `C:\xampp\htdocs\FLN_monitoringSystem`
2. Start `Apache` and `MySQL`
3. Import [database/complete_migration.sql](/c:/xampp/htdocs/FLN_monitoringSystem/database/complete_migration.sql)
4. Run:

```powershell
cd C:\xampp\htdocs\FLN_monitoringSystem
C:\xampp\php\php.exe database\sync_workbook_data.php
```

5. Open:

```text
http://localhost/FLN_monitoringSystem/cluster.html
```
