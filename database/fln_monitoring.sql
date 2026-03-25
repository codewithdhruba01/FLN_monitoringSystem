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
  cluster_id INT NOT NULL,
  school_id INT NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  class_name VARCHAR(20) NOT NULL DEFAULT '',
  gender ENUM('Boy', 'Girl', 'Other') DEFAULT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_students_cluster FOREIGN KEY (cluster_id) REFERENCES clusters(id),
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
  cluster_id INT NOT NULL,
  school_id INT NOT NULL,
  material_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_materials_report FOREIGN KEY (report_id) REFERENCES monitoring_reports(id) ON DELETE CASCADE,
  CONSTRAINT fk_materials_cluster FOREIGN KEY (cluster_id) REFERENCES clusters(id),
  CONSTRAINT fk_materials_school FOREIGN KEY (school_id) REFERENCES schools(id)
);

CREATE TABLE monitoring_subjects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  report_id INT NOT NULL,
  cluster_id INT NOT NULL,
  school_id INT NOT NULL,
  subject_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_subjects_report FOREIGN KEY (report_id) REFERENCES monitoring_reports(id) ON DELETE CASCADE,
  CONSTRAINT fk_subjects_cluster FOREIGN KEY (cluster_id) REFERENCES clusters(id),
  CONSTRAINT fk_subjects_school FOREIGN KEY (school_id) REFERENCES schools(id)
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
  (1, 1, 'Abhetlav Primary School'),
  (2, 1, 'Academy Centre - Masvad'),
  (3, 1, 'Academy Centre - Arad'),
  (4, 1, 'Academy Centre - Govind Puri'),
  (5, 1, 'Aedalpura Primary School'),
  (6, 1, 'Govindpuri Remedial(LIB)'),
  (7, 1, 'Lalpuri Primary School'),
  (8, 1, 'Rahtlav Primary School'),
  (9, 1, 'Dhikva Primary School'),
  (10, 1, 'Kharkadi Primary School'),
  (11, 1, 'Nava Jakhriya Primary School'),
  (12, 1, 'Pindgini Muvadi Primary School'),
  (13, 2, 'Shri Chhtrapati Shivaji Vcidya Mandir, Kanhe'),
  (14, 2, 'Shriram Vidyalaya, Navalakh Umbre'),
  (15, 2, 'Z P Primary Schoool, Bhoyare'),
  (16, 2, 'Z.P. Primary School,Ambi'),
  (17, 2, 'Z.P. Primary School, Badhalwadi'),
  (18, 2, 'Z.P.Primary School Nanoli Tarfe Chakan'),
  (19, 2, 'Z.P. Primary School, Navlakh Umbre'),
  (20, 2, 'Z.P. Primary School, Urse'),
  (21, 2, 'Z.P. Primary School, Varale');

INSERT INTO teachers (cluster_id, school_id, full_name) VALUES
  (1, 1, 'Anjaliben Manharbhai Varia'),
  (1, 2, 'Chavda Hansaben'),
  (1, 3, 'Dharmeshsinh Parmar'),
  (1, 4, 'Divyaben Kesharsinh Rathod'),
  (1, 5, 'Khumansinh Dolatsinh Solanki'),
  (1, 6, 'Lalita Ghojage'),
  (1, 7, 'Manaharkumar Parmar'),
  (1, 8, 'Mitulsinh Solanki'),
  (1, 9, 'Priyanka'),
  (1, 10, 'Priyankaben'),
  (1, 11, 'Sanjana Parmar'),
  (1, 12, 'Vishnubhai'),
  (2, 13, 'Archana Shinde'),
  (2, 14, 'Bhagyashree Ganesh Marathe'),
  (2, 15, 'Kajal Bansode'),
  (2, 16, 'Kalyani Thakur'),
  (2, 17, 'Komal Shirke'),
  (2, 18, 'Pooja Swapnil Bhosale'),
  (2, 19, 'Rupali Jambhulkar'),
  (2, 20, 'Sayali Sushant Chavan'),
  (2, 21, 'Sonali Gaikwad');
