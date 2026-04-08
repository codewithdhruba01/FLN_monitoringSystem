CREATE DATABASE IF NOT EXISTS fln_monitoring
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE fln_monitoring;

INSERT INTO clusters (id, name)
VALUES (1, 'Halol'), (2, 'Maval')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO schools (id, cluster_id, name)
VALUES
  (1, 1, 'Abhetlav Primary School'),
  (13, 2, 'Shri Chhtrapati Shivaji Vcidya Mandir, Kanhe')
ON DUPLICATE KEY UPDATE
  cluster_id = VALUES(cluster_id),
  name = VALUES(name);

INSERT INTO students (id, cluster_id, school_id, full_name, class_name, gender, is_active)
VALUES
  (2001, 1, 1, 'Aarav Patel', 'Class 1', 'Boy', 1),
  (2002, 1, 1, 'Diya Shah', 'Class 1', 'Girl', 1),
  (2003, 1, 1, 'Ishaan Parmar', 'Class 2', 'Boy', 1),
  (2004, 1, 1, 'Kavya Solanki', 'Class 2', 'Girl', 1),
  (2005, 1, 1, 'Mihir Rathod', 'Class 3', 'Boy', 1),
  (2006, 1, 1, 'Riya Chauhan', 'Class 3', 'Girl', 1),
  (2013, 2, 13, 'Saanvi Jadhav', 'Class 4', 'Girl', 1),
  (2014, 2, 13, 'Vihaan Shinde', 'Class 4', 'Boy', 1)
ON DUPLICATE KEY UPDATE
  cluster_id = VALUES(cluster_id),
  school_id = VALUES(school_id),
  full_name = VALUES(full_name),
  class_name = VALUES(class_name),
  gender = VALUES(gender),
  is_active = VALUES(is_active);

CREATE TABLE IF NOT EXISTS attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  status ENUM('present', 'absent') NOT NULL,
  date DATE NOT NULL,
  subject_name VARCHAR(100) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_analytics_attendance_student
    FOREIGN KEY (student_id) REFERENCES students(id)
    ON DELETE CASCADE,
  UNIQUE KEY uq_student_date (student_id, date),
  KEY idx_attendance_date (date),
  KEY idx_attendance_status (status),
  KEY idx_attendance_subject (subject_name)
);

DELETE FROM attendance
WHERE student_id IN (2001, 2002, 2003, 2004, 2005, 2006, 2013, 2014);

INSERT INTO attendance (student_id, status, date, subject_name) VALUES
  (2001, 'present', '2026-03-18', 'Language'),
  (2002, 'present', '2026-03-18', 'Language'),
  (2003, 'absent', '2026-03-18', 'Language'),
  (2004, 'present', '2026-03-18', 'Language'),
  (2005, 'present', '2026-03-18', 'Language'),
  (2006, 'absent', '2026-03-18', 'Language'),
  (2013, 'present', '2026-03-18', 'Language'),
  (2014, 'present', '2026-03-18', 'Language'),

  (2001, 'present', '2026-03-19', 'Math'),
  (2002, 'absent', '2026-03-19', 'Math'),
  (2003, 'present', '2026-03-19', 'Math'),
  (2004, 'present', '2026-03-19', 'Math'),
  (2005, 'present', '2026-03-19', 'Math'),
  (2006, 'present', '2026-03-19', 'Math'),
  (2013, 'present', '2026-03-19', 'Math'),
  (2014, 'absent', '2026-03-19', 'Math'),

  (2001, 'absent', '2026-03-20', 'English'),
  (2002, 'present', '2026-03-20', 'English'),
  (2003, 'present', '2026-03-20', 'English'),
  (2004, 'present', '2026-03-20', 'English'),
  (2005, 'absent', '2026-03-20', 'English'),
  (2006, 'present', '2026-03-20', 'English'),
  (2013, 'present', '2026-03-20', 'English'),
  (2014, 'present', '2026-03-20', 'English'),

  (2001, 'present', '2026-03-21', 'EVS'),
  (2002, 'present', '2026-03-21', 'EVS'),
  (2003, 'present', '2026-03-21', 'EVS'),
  (2004, 'absent', '2026-03-21', 'EVS'),
  (2005, 'present', '2026-03-21', 'EVS'),
  (2006, 'present', '2026-03-21', 'EVS'),
  (2013, 'absent', '2026-03-21', 'EVS'),
  (2014, 'present', '2026-03-21', 'EVS'),

  (2001, 'present', '2026-03-22', 'Language'),
  (2002, 'present', '2026-03-22', 'Language'),
  (2003, 'present', '2026-03-22', 'Language'),
  (2004, 'present', '2026-03-22', 'Language'),
  (2005, 'absent', '2026-03-22', 'Language'),
  (2006, 'present', '2026-03-22', 'Language'),
  (2013, 'present', '2026-03-22', 'Language'),
  (2014, 'present', '2026-03-22', 'Language'),

  (2001, 'present', '2026-03-23', 'Math'),
  (2002, 'present', '2026-03-23', 'Math'),
  (2003, 'absent', '2026-03-23', 'Math'),
  (2004, 'present', '2026-03-23', 'Math'),
  (2005, 'present', '2026-03-23', 'Math'),
  (2006, 'present', '2026-03-23', 'Math'),
  (2013, 'present', '2026-03-23', 'Math'),
  (2014, 'present', '2026-03-23', 'Math'),

  (2001, 'present', '2026-03-24', 'English'),
  (2002, 'absent', '2026-03-24', 'English'),
  (2003, 'present', '2026-03-24', 'English'),
  (2004, 'present', '2026-03-24', 'English'),
  (2005, 'present', '2026-03-24', 'English'),
  (2006, 'absent', '2026-03-24', 'English'),
  (2013, 'present', '2026-03-24', 'English'),
  (2014, 'present', '2026-03-24', 'English'),

  (2001, 'present', '2026-03-25', 'EVS'),
  (2002, 'present', '2026-03-25', 'EVS'),
  (2003, 'present', '2026-03-25', 'EVS'),
  (2004, 'present', '2026-03-25', 'EVS'),
  (2005, 'present', '2026-03-25', 'EVS'),
  (2006, 'present', '2026-03-25', 'EVS'),
  (2013, 'absent', '2026-03-25', 'EVS'),
  (2014, 'present', '2026-03-25', 'EVS'),

  (2001, 'absent', '2026-03-26', 'Language'),
  (2002, 'present', '2026-03-26', 'Language'),
  (2003, 'present', '2026-03-26', 'Language'),
  (2004, 'absent', '2026-03-26', 'Language'),
  (2005, 'present', '2026-03-26', 'Language'),
  (2006, 'present', '2026-03-26', 'Language'),
  (2013, 'present', '2026-03-26', 'Language'),
  (2014, 'present', '2026-03-26', 'Language'),

  (2001, 'present', '2026-03-27', 'Math'),
  (2002, 'present', '2026-03-27', 'Math'),
  (2003, 'present', '2026-03-27', 'Math'),
  (2004, 'present', '2026-03-27', 'Math'),
  (2005, 'absent', '2026-03-27', 'Math'),
  (2006, 'present', '2026-03-27', 'Math'),
  (2013, 'present', '2026-03-27', 'Math'),
  (2014, 'absent', '2026-03-27', 'Math'),

  (2001, 'present', '2026-03-28', 'English'),
  (2002, 'absent', '2026-03-28', 'English'),
  (2003, 'present', '2026-03-28', 'English'),
  (2004, 'present', '2026-03-28', 'English'),
  (2005, 'present', '2026-03-28', 'English'),
  (2006, 'absent', '2026-03-28', 'English'),
  (2013, 'present', '2026-03-28', 'English'),
  (2014, 'present', '2026-03-28', 'English');
