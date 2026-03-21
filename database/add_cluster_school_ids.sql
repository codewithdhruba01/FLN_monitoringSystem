USE fln_monitoring;

ALTER TABLE teachers
  ADD COLUMN cluster_id INT NULL AFTER id;

UPDATE teachers t
INNER JOIN schools s ON s.id = t.school_id
SET t.cluster_id = s.cluster_id
WHERE t.cluster_id IS NULL;

ALTER TABLE teachers
  MODIFY cluster_id INT NOT NULL,
  ADD CONSTRAINT fk_teachers_cluster FOREIGN KEY (cluster_id) REFERENCES clusters(id);

ALTER TABLE student_performance
  ADD COLUMN cluster_id INT NULL AFTER report_id,
  ADD COLUMN school_id INT NULL AFTER cluster_id;

UPDATE student_performance sp
INNER JOIN monitoring_reports mr ON mr.id = sp.report_id
SET
  sp.cluster_id = mr.cluster_id,
  sp.school_id = mr.school_id
WHERE sp.cluster_id IS NULL OR sp.school_id IS NULL;

ALTER TABLE student_performance
  MODIFY cluster_id INT NOT NULL,
  MODIFY school_id INT NOT NULL,
  ADD CONSTRAINT fk_performance_cluster FOREIGN KEY (cluster_id) REFERENCES clusters(id),
  ADD CONSTRAINT fk_performance_school FOREIGN KEY (school_id) REFERENCES schools(id);

ALTER TABLE student_attendance
  ADD COLUMN cluster_id INT NULL AFTER report_id,
  ADD COLUMN school_id INT NULL AFTER cluster_id;

UPDATE student_attendance sa
INNER JOIN monitoring_reports mr ON mr.id = sa.report_id
SET
  sa.cluster_id = mr.cluster_id,
  sa.school_id = mr.school_id
WHERE sa.cluster_id IS NULL OR sa.school_id IS NULL;

ALTER TABLE student_attendance
  MODIFY cluster_id INT NOT NULL,
  MODIFY school_id INT NOT NULL,
  ADD CONSTRAINT fk_attendance_cluster FOREIGN KEY (cluster_id) REFERENCES clusters(id),
  ADD CONSTRAINT fk_attendance_school FOREIGN KEY (school_id) REFERENCES schools(id);
