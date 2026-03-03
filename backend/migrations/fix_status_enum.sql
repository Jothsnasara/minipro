-- 1. Modify the tasks table to support the statuses used in the frontend
ALTER TABLE tasks 
MODIFY COLUMN status ENUM('Pending', 'In Progress', 'Completed', 'Pending Review') DEFAULT 'Pending';

-- 2. Ensure activity_log exists with correct schema
CREATE TABLE IF NOT EXISTS activity_log (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    task_id INT,
    action VARCHAR(255) NOT NULL,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES tasks(task_id) ON DELETE SET NULL
);

-- 3. Just in case, make sure progress column exists
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS progress INT DEFAULT 0;
