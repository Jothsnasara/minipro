DELIMITER //

CREATE TRIGGER restrict_task_on_completed_project
BEFORE INSERT ON tasks
FOR EACH ROW
BEGIN
    DECLARE project_status VARCHAR(50);

    -- Get the status of the parent project
    SELECT status INTO project_status 
    FROM projects 
    WHERE project_id = NEW.project_id;

    -- If project is completed, block the insertion
    IF project_status = 'Completed' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot add tasks to a completed project.';
    END IF;
END; //

-- Also create one for UPDATES so existing tasks can't be changed
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
