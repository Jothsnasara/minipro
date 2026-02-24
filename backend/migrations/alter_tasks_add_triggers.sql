ALTER TABLE tasks 
  ADD COLUMN IF NOT EXISTS estimated_hours DECIMAL(6,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS resources TEXT;

DROP TRIGGER IF EXISTS restrict_task_on_completed_project;
DROP TRIGGER IF EXISTS restrict_task_update_on_completed_project;

DELIMITER //

CREATE TRIGGER restrict_task_on_completed_project
BEFORE INSERT ON tasks
FOR EACH ROW
BEGIN
    DECLARE project_status VARCHAR(50);
    SELECT status INTO project_status 
    FROM projects 
    WHERE project_id = NEW.project_id;

    IF project_status = 'Completed' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot add tasks to a completed project.';
    END IF;
END; //

CREATE TRIGGER restrict_task_update_on_completed_project
BEFORE UPDATE ON tasks
FOR EACH ROW
BEGIN
    DECLARE project_status VARCHAR(50);
    SELECT status INTO project_status 
    FROM projects 
    WHERE project_id = OLD.project_id;

    IF project_status = 'Completed' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot modify tasks of a completed project.';
    END IF;
END; //

DELIMITER ;
