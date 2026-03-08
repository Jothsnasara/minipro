require('dotenv').config({ path: './backend/.env' });
const db = require('./backend/config/db');

async function setup() {
    try {
        console.log("Creating tasks table...");
        await db.query(`
            CREATE TABLE IF NOT EXISTS tasks (
                id INT AUTO_INCREMENT PRIMARY KEY,
                project_id INT NOT NULL,
                task_name VARCHAR(255) NOT NULL,
                assigned_to INT,
                priority ENUM('High', 'Medium', 'Low') DEFAULT 'Medium',
                status ENUM('Todo', 'In Progress', 'Completed') DEFAULT 'Todo',
                due_date DATE,
                est_hours INT,
                resources TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log("Tasks table created successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Error creating tasks table:", err);
        process.exit(1);
    }
}

setup();
