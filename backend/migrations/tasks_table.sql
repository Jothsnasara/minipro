-- =============================================
-- Task Table Migration + Triggers
-- Database: minipro
-- =============================================

CREATE TABLE IF NOT EXISTS tasks (
    task_id INT PRIMARY KEY AUTO_INCREMENT,
    project_id INT NOT NULL,
    task_name VARCHAR(255) NOT NULL,
    assigned_to INT,                          -- Links to users.id
    priority ENUM('Low', 'Medium', 'High') DEFAULT 'Medium',
    status ENUM('Pending', 'In Progress', 'Completed') DEFAULT 'Pending',
    due_date DATE,
    estimated_hours DECIMAL(6,2) DEFAULT 0,
    resources TEXT,                           -- comma-separated resource list
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);

-- Drop triggers if they already exist (safe re-run)
DROP TRIGGER IF EXISTS restrict_task_on_completed_project;
DROP TRIGGER IF EXISTS restrict_task_update_on_completed_project;

DELIMITER //

-- Prevent task INSERT on a Completed project
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

-- Prevent task UPDATE on a Completed project
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
