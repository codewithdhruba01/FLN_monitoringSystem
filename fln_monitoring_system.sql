-- Create FLN monitoring database
CREATE DATABASE fln_monitoring_system;

-- Select the database
USE fln_monitoring_system;



-- Create tables for monitoring system


-- Table to store cluster names
CREATE TABLE clusters (

    id INT AUTO_INCREMENT PRIMARY KEY,  -- Unique cluster ID
    cluster_name VARCHAR(50) NOT NULL   -- Cluster name (Halol / Maval)

);
-- Insert two clusters
INSERT INTO clusters (cluster_name) VALUES
('Halol'),
('Maval');


-- Table to store schools under each cluster
CREATE TABLE schools (

    id INT AUTO_INCREMENT PRIMARY KEY,  -- Unique school ID

    cluster_id INT,                     -- Cluster reference

    school_name VARCHAR(100),           -- School name

    -- Foreign key linking cluster table
    FOREIGN KEY (cluster_id) REFERENCES clusters(id)

);
-- Insert sample schools for each cluster
-- Halol cluster schools
INSERT INTO schools (cluster_id, school_name) VALUES
(1,'halol_school1'),
(1,'halol_school2'),
(1,'halol_school3'),
(1,'halol_school4'),
(1,'halol_school5'),
(1,'halol_school6'),
(1,'halol_school7'),
(1,'halol_school8');

-- Maval cluster schools
INSERT INTO schools (cluster_id, school_name) VALUES
(2,'maval_school1'),
(2,'maval_school2'),
(2,'maval_school3'),
(2,'maval_school4'),
(2,'maval_school5'),
(2,'maval_school6'),
(2,'maval_school7'),
(2,'maval_school8');


-- Each school has one teacher
CREATE TABLE teachers (

    id INT AUTO_INCREMENT PRIMARY KEY,  -- Teacher ID

    school_id INT,                      -- School reference

    teacher_name VARCHAR(100),          -- Teacher name

    -- Link teacher to school
    FOREIGN KEY (school_id) REFERENCES schools(id)

);


-- Halol teachers
INSERT INTO teachers (school_id, teacher_name) VALUES
(1,'Ramesh Patel'),
(2,'Meena Shah'),
(3,'Rajesh Chauhan'),
(4,'Kavita Desai'),
(5,'Amit Parmar'),
(6,'Neha Trivedi'),
(7,'Suresh Solanki'),
(8,'Pooja Joshi');

-- Maval teachers
INSERT INTO teachers (school_id, teacher_name) VALUES
(9,'Rahul Patel'),
(10,'Priya Mehta'),
(11,'Kiran Patel'),
(12,'Anjali Sharma'),
(13,'Deepak Chaudhary'),
(14,'Bhavna Pandya'),
(15,'Mahesh Patel'),
(16,'Ritu Singh');



-- Stores student basic details
CREATE TABLE students (

    student_id INT AUTO_INCREMENT PRIMARY KEY,  -- Unique student ID

    school_id INT,                              -- School reference

    student_name VARCHAR(100),                  -- Student name

    roll_number INT,                            -- Student roll number

    class_name VARCHAR(20),                     -- Class name

    -- Link student to school
    FOREIGN KEY (school_id) REFERENCES schools(id)

);



-- Stores daily student monitoring data
CREATE TABLE student_daily_monitoring (

    id INT AUTO_INCREMENT PRIMARY KEY,  -- Record ID

    cluster_name VARCHAR(50),           -- Cluster name

    school_name VARCHAR(100),           -- School name

    teacher_name VARCHAR(100),          -- Teacher name

    student_id INT,                     -- Student ID

    student_name VARCHAR(100),          -- Student name

    student_roll_number INT,            -- Student roll number

    class_name VARCHAR(20),             -- Class

    monitoring_date DATE,               -- Monitoring date

    student_attendance ENUM('Present','Absent'),  -- Attendance

    student_performance_rank INT,       -- Rank (1-5)

    literacy_focus VARCHAR(100),        -- Literacy activity

    numeracy_focus VARCHAR(100),        -- Numeracy activity

    remarks TEXT                        -- Teacher remarks

);


-- Example daily record
INSERT INTO student_daily_monitoring
(cluster_name,school_name,teacher_name,student_id,student_name,student_roll_number,class_name,monitoring_date,student_attendance,student_performance_rank,literacy_focus,numeracy_focus,remarks)

VALUES
('Halol','halol_school1','Ramesh Patel',1,'Aman Patel',1,'Class 2','2026-03-14','Present',4,'Reading','Counting','Good progress');




/* clusters
   │
   └── schools
          │
          └── teachers
          │
          └── students
                 │
                 └── student_daily_monitoring */


