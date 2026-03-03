-- Drop triggers if they exist
DROP TRIGGER IF EXISTS activate_user_on_task_assignment;
DROP TRIGGER IF EXISTS activate_user_on_task_update;

DELIMITER //

-- Activate user AFTER a new task is inserted with an assignee
CREATE TRIGGER activate_user_on_task_assignment
AFTER INSERT ON tasks
FOR EACH ROW
BEGIN
    IF NEW.assigned_to IS NOT NULL THEN
        UPDATE users SET status = 'Active' WHERE id = NEW.assigned_to;
    END IF;
END; //

-- Activate user AFTER a task is updated with a new assignee
CREATE TRIGGER activate_user_on_task_update
AFTER UPDATE ON tasks
FOR EACH ROW
BEGIN
    IF NEW.assigned_to IS NOT NULL AND (OLD.assigned_to IS NULL OR NEW.assigned_to <> OLD.assigned_to) THEN
        UPDATE users SET status = 'Active' WHERE id = NEW.assigned_to;
    END IF;
END; //

DELIMITER ;
