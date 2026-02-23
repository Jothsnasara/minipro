-- 1. Add specialization to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS specialization VARCHAR(255);

-- 2. Enhance tasks table
-- Depending on existing data, we might want to drop and recreate or just alter. 
-- Since the user asked for a specific PK 'task_id', let's migrate if exists or recreate.
DROP TABLE IF EXISTS tasks;

CREATE TABLE tasks (
    task_id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    task_name VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to INT NOT NULL,
    priority ENUM('Low', 'Medium', 'High') DEFAULT 'Medium',
    status ENUM('Pending', 'In Progress', 'Completed') DEFAULT 'Pending',
    due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. SQL Triggers for Completed Project Enforcement
DROP TRIGGER IF EXISTS restrict_task_on_completed_project;
DELIMITER //
CREATE TRIGGER restrict_task_on_completed_project
BEFORE INSERT ON tasks
FOR EACH ROW
BEGIN
    DECLARE project_status VARCHAR(50);
    SELECT status INTO project_status FROM projects WHERE project_id = NEW.project_id;
    IF project_status = 'Completed' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot add tasks to a completed project.';
    END IF;
END; //
DELIMITER ;

DROP TRIGGER IF EXISTS restrict_task_update_on_completed_project;
DELIMITER //
CREATE TRIGGER restrict_task_update_on_completed_project
BEFORE UPDATE ON tasks
FOR EACH ROW
BEGIN
    DECLARE project_status VARCHAR(50);
    SELECT status INTO project_status FROM projects WHERE project_id = OLD.project_id;
    IF project_status = 'Completed' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot modify tasks of a completed project.';
    END IF;
END; //
DELIMITER ;
