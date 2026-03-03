const db = require('./config/db');

const query = (sql, params) => new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
        if (err) reject(err);
        else resolve(results);
    });
});

async function testAddTask() {
    try {
        console.log("Testing Add Task...");

        // 1. Get a project ID
        const projects = await query('SELECT project_id FROM projects LIMIT 1');
        if (projects.length === 0) {
            console.log("No projects found. Cannot test add task.");
            process.exit(0);
        }
        const projectId = projects[0].project_id;
        console.log("Using Project ID:", projectId);

        // 2. Try to insert a task
        const title = "Test Debug Task " + Date.now();
        const assignedTo = null; // Unassigned
        const priority = 'Medium';
        const dbStatus = 'Pending';
        const dueDate = '2026-12-31';
        const estimatedHours = 10;
        const resourceStr = 'TestResource';

        console.log("Inserting task...");
        const result = await query(
            `INSERT INTO tasks (project_id, task_name, assigned_to, priority, status, due_date, estimated_hours, resources)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [projectId, title, assignedTo, priority, dbStatus, dueDate, estimatedHours, resourceStr]
        );

        console.log("Task inserted successfully! ID:", result.insertId);
        process.exit(0);
    } catch (error) {
        console.error("ADD TASK FAILED!");
        console.error("Error Code:", error.code);
        console.error("Error Message:", error.message);
        if (error.sql) console.error("SQL:", error.sql);
        process.exit(1);
    }
}

testAddTask();
