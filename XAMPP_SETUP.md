# XAMPP MySQL Setup

## 1. Start XAMPP

- Start `Apache`
- Start `MySQL`

## 2. Create the database

Open `phpMyAdmin` and import:

- [database/fln_monitoring.sql](/d:/Fln form/FLN form/database/fln_monitoring.sql)

This creates:

- `fln_monitoring` database
- `Halol` and `Maval` clusters
- 6 schools
- teachers
- students
- all report tables needed to store the full FLN form

## 3. Put the project in XAMPP

Place this project folder inside:

- `C:\xampp\htdocs\`

Then open:

- `http://localhost/FLN%20form/cluster.html`

## 4. Database config

The PHP connection file is:

- [api/config.php](/d:/Fln form/FLN form/api/config.php)

Default XAMPP values already configured:

- host: `127.0.0.1`
- port: `3306`
- database: `fln_monitoring`
- username: `root`
- password: empty

If your MySQL password is different, update that file.

## 5. What is saved

- cluster
- school
- teacher
- class and section
- date
- total present, boys present, girls present
- FLN period status and reason
- duration
- materials used
- subjects covered
- engagement level
- main topic
- literacy and numeracy focus
- remarks
- every student's performance
- every student's attendance

## 6. Important note

I seeded the database with the sample schools already present in the project and starter teachers/students for each school.

If you want the real Halol and Maval school data next, send me:

- exact school list
- teacher names per school
- student lists per school
- grades and sections per school
