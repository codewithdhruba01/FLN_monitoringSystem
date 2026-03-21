CREATE DATABASE IF NOT EXISTS fln_monitoring
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE fln_monitoring;

DROP TABLE IF EXISTS student_attendance;
DROP TABLE IF EXISTS student_performance;
DROP TABLE IF EXISTS monitoring_subjects;
DROP TABLE IF EXISTS monitoring_materials;
DROP TABLE IF EXISTS monitoring_reports;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS teachers;
DROP TABLE IF EXISTS schools;
DROP TABLE IF EXISTS clusters;

CREATE TABLE clusters (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE schools (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cluster_id INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_cluster_school (cluster_id, name),
  CONSTRAINT fk_schools_cluster FOREIGN KEY (cluster_id) REFERENCES clusters(id)
);

CREATE TABLE teachers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cluster_id INT NOT NULL,
  school_id INT NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  designation VARCHAR(100) DEFAULT 'Teacher',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_teachers_cluster FOREIGN KEY (cluster_id) REFERENCES clusters(id),
  CONSTRAINT fk_teachers_school FOREIGN KEY (school_id) REFERENCES schools(id)
);

CREATE TABLE students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  gender ENUM('Boy', 'Girl', 'Other') DEFAULT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_students_school FOREIGN KEY (school_id) REFERENCES schools(id)
);

CREATE TABLE monitoring_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cluster_id INT NOT NULL,
  school_id INT NOT NULL,
  teacher_id INT NOT NULL,
  grade_name VARCHAR(50) NOT NULL,
  section_name VARCHAR(50) NOT NULL,
  monitoring_date DATE NOT NULL,
  students_present INT NOT NULL,
  boys_present INT NOT NULL,
  girls_present INT NOT NULL,
  fln_period_happened TINYINT(1) NOT NULL,
  fln_not_happened_reason VARCHAR(100) DEFAULT NULL,
  instruction_duration_minutes INT NOT NULL,
  engagement_level VARCHAR(30) NOT NULL,
  main_topic VARCHAR(255) NOT NULL,
  literacy_focus VARCHAR(150) NOT NULL,
  literacy_concept VARCHAR(255) NOT NULL,
  numeracy_focus VARCHAR(150) NOT NULL,
  numeracy_concept VARCHAR(255) NOT NULL,
  remarks TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reports_cluster FOREIGN KEY (cluster_id) REFERENCES clusters(id),
  CONSTRAINT fk_reports_school FOREIGN KEY (school_id) REFERENCES schools(id),
  CONSTRAINT fk_reports_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id)
);

CREATE TABLE monitoring_materials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  report_id INT NOT NULL,
  material_name VARCHAR(100) NOT NULL,
  CONSTRAINT fk_materials_report FOREIGN KEY (report_id) REFERENCES monitoring_reports(id) ON DELETE CASCADE
);

CREATE TABLE monitoring_subjects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  report_id INT NOT NULL,
  subject_name VARCHAR(100) NOT NULL,
  CONSTRAINT fk_subjects_report FOREIGN KEY (report_id) REFERENCES monitoring_reports(id) ON DELETE CASCADE
);

CREATE TABLE student_performance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  report_id INT NOT NULL,
  cluster_id INT NOT NULL,
  school_id INT NOT NULL,
  student_id INT DEFAULT NULL,
  student_number INT NOT NULL,
  student_name VARCHAR(150) NOT NULL,
  performance_level TINYINT NOT NULL,
  needs_support TINYINT(1) NOT NULL DEFAULT 0,
  CONSTRAINT fk_performance_report FOREIGN KEY (report_id) REFERENCES monitoring_reports(id) ON DELETE CASCADE,
  CONSTRAINT fk_performance_cluster FOREIGN KEY (cluster_id) REFERENCES clusters(id),
  CONSTRAINT fk_performance_school FOREIGN KEY (school_id) REFERENCES schools(id),
  CONSTRAINT fk_performance_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL
);

CREATE TABLE student_attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  report_id INT NOT NULL,
  cluster_id INT NOT NULL,
  school_id INT NOT NULL,
  student_id INT DEFAULT NULL,
  student_number INT NOT NULL,
  student_name VARCHAR(150) NOT NULL,
  attendance_status ENUM('present', 'absent') NOT NULL,
  CONSTRAINT fk_attendance_report FOREIGN KEY (report_id) REFERENCES monitoring_reports(id) ON DELETE CASCADE,
  CONSTRAINT fk_attendance_cluster FOREIGN KEY (cluster_id) REFERENCES clusters(id),
  CONSTRAINT fk_attendance_school FOREIGN KEY (school_id) REFERENCES schools(id),
  CONSTRAINT fk_attendance_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL
);

INSERT INTO clusters (id, name) VALUES
  (1, 'Halol'),
  (2, 'Maval');

INSERT INTO schools (id, cluster_id, name) VALUES
  (1, 1, 'Halol Primary School'),
  (2, 1, 'Halol Model School'),
  (3, 1, 'Halol International School'),
  (4, 2, 'Maval ZP School'),
  (5, 2, 'Maval Central School'),
  (6, 2, 'Maval High School');

INSERT INTO teachers (cluster_id, school_id, full_name) VALUES
  (1, 1, 'Rajesh Kumar'),
  (1, 1, 'Priya Singh'),
  (1, 2, 'Arun Verma'),
  (1, 2, 'Neha Sharma'),
  (1, 3, 'Vikram Patel'),
  (1, 3, 'Sunita Desai'),
  (2, 4, 'Mahesh Pawar'),
  (2, 4, 'Kiran Jadhav'),
  (2, 5, 'Seema Kulkarni'),
  (2, 5, 'Rohit Shinde'),
  (2, 6, 'Anita More'),
  (2, 6, 'Sanjay Patil');

INSERT INTO students (school_id, full_name, gender) VALUES
  (1, 'Aarav Sharma', 'Boy'),
  (1, 'Vivaan Patel', 'Boy'),
  (1, 'Ananya Singh', 'Girl'),
  (1, 'Diya Verma', 'Girl'),
  (1, 'Aditya Kumar', 'Boy'),
  (1, 'Ishita Nair', 'Girl'),
  (1, 'Krish Yadav', 'Boy'),
  (1, 'Meera Joshi', 'Girl'),
  (1, 'Arjun Reddy', 'Boy'),
  (1, 'Saanvi Gupta', 'Girl'),
  (1, 'Reyansh Mehta', 'Boy'),
  (1, 'Kavya Iyer', 'Girl'),
  (2, 'Aarav Sharma', 'Boy'),
  (2, 'Vivaan Patel', 'Boy'),
  (2, 'Ananya Singh', 'Girl'),
  (2, 'Diya Verma', 'Girl'),
  (2, 'Aditya Kumar', 'Boy'),
  (2, 'Ishita Nair', 'Girl'),
  (2, 'Krish Yadav', 'Boy'),
  (2, 'Meera Joshi', 'Girl'),
  (2, 'Arjun Reddy', 'Boy'),
  (2, 'Saanvi Gupta', 'Girl'),
  (2, 'Reyansh Mehta', 'Boy'),
  (2, 'Kavya Iyer', 'Girl'),
  (3, 'Aarav Sharma', 'Boy'),
  (3, 'Vivaan Patel', 'Boy'),
  (3, 'Ananya Singh', 'Girl'),
  (3, 'Diya Verma', 'Girl'),
  (3, 'Aditya Kumar', 'Boy'),
  (3, 'Ishita Nair', 'Girl'),
  (3, 'Krish Yadav', 'Boy'),
  (3, 'Meera Joshi', 'Girl'),
  (3, 'Arjun Reddy', 'Boy'),
  (3, 'Saanvi Gupta', 'Girl'),
  (3, 'Reyansh Mehta', 'Boy'),
  (3, 'Kavya Iyer', 'Girl'),
  (4, 'Aarav Sharma', 'Boy'),
  (4, 'Vivaan Patel', 'Boy'),
  (4, 'Ananya Singh', 'Girl'),
  (4, 'Diya Verma', 'Girl'),
  (4, 'Aditya Kumar', 'Boy'),
  (4, 'Ishita Nair', 'Girl'),
  (4, 'Krish Yadav', 'Boy'),
  (4, 'Meera Joshi', 'Girl'),
  (4, 'Arjun Reddy', 'Boy'),
  (4, 'Saanvi Gupta', 'Girl'),
  (4, 'Reyansh Mehta', 'Boy'),
  (4, 'Kavya Iyer', 'Girl'),
  (5, 'Aarav Sharma', 'Boy'),
  (5, 'Vivaan Patel', 'Boy'),
  (5, 'Ananya Singh', 'Girl'),
  (5, 'Diya Verma', 'Girl'),
  (5, 'Aditya Kumar', 'Boy'),
  (5, 'Ishita Nair', 'Girl'),
  (5, 'Krish Yadav', 'Boy'),
  (5, 'Meera Joshi', 'Girl'),
  (5, 'Arjun Reddy', 'Boy'),
  (5, 'Saanvi Gupta', 'Girl'),
  (5, 'Reyansh Mehta', 'Boy'),
  (5, 'Kavya Iyer', 'Girl'),
  (6, 'Aarav Sharma', 'Boy'),
  (6, 'Vivaan Patel', 'Boy'),
  (6, 'Ananya Singh', 'Girl'),
  (6, 'Diya Verma', 'Girl'),
  (6, 'Aditya Kumar', 'Boy'),
  (6, 'Ishita Nair', 'Girl'),
  (6, 'Krish Yadav', 'Boy'),
  (6, 'Meera Joshi', 'Girl'),
  (6, 'Arjun Reddy', 'Boy'),
  (6, 'Saanvi Gupta', 'Girl'),
  (6, 'Reyansh Mehta', 'Boy'),
  (6, 'Kavya Iyer', 'Girl');
