const mysql = require("mysql2");
require("dotenv").config({ path: "./.env" });

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect(err => {
    if (err) {
        console.error("DB ERROR: " + err.message);
        process.exit(1);
    }
    console.log("DB CONNECTED");

    const createTableSql = `
    CREATE TABLE IF NOT EXISTS tasks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project_id INT NOT NULL,
      assigned_to INT NOT NULL,
      task_name VARCHAR(255) NOT NULL,
      status VARCHAR(50) DEFAULT 'Pending',
      due_date DATE,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE CASCADE
    )
  `;

    db.query(createTableSql, (err) => {
        if (err) {
            console.error("CREATE TABLE ERROR: " + err.message);
            process.exit(1);
        }
        console.log("Tasks table created or already exists.");

        // Seed data
        // Assuming project 1 exists and user 14 (manager) exists. 
        // We need some members. Let's assign to user 14 for now or any other user if we knew their IDs.
        // For safety, let's just create a task linked to an existing project.

        // First get a project id
        db.query("SELECT id FROM projects LIMIT 1", (err, projects) => {
            if (err || projects.length === 0) {
                console.log("No projects found to assign tasks to.");
                db.end();
                return;
            }
            const projectId = projects[0].id;

            // Get a user id (not the manager ideally, but for now just any user)
            db.query("SELECT id FROM users LIMIT 1", (err, users) => {
                if (err || users.length === 0) {
                    console.log("No users found to assign tasks to.");
                    db.end();
                    return;
                }
                const userId = users[0].id;

                const insertSql = `
                INSERT INTO tasks (project_id, assigned_to, task_name, status, due_date)
                VALUES (?, ?, 'Dummy Task', 'In Progress', CURDATE() + INTERVAL 5 DAY)
            `;

                db.query(insertSql, [projectId, userId], (err) => {
                    if (err) console.error("INSERT ERROR: " + err.message);
                    else console.log(`Dummy task assigned to user ${userId} for project ${projectId}`);
                    db.end();
                });
            });
        });
    });
});
