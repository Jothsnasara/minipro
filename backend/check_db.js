require('dotenv').config();
const db = require('./config/db');

async function checkDb() {
    try {
        console.log("=== DB DIAGNOSTIC ===");
        
        // Check notifications
        let notifs = [];
        try {
            const [rows] = await db.query("SELECT * FROM notifications ORDER BY notification_id DESC LIMIT 5");
            notifs = rows;
            console.log("Notifications Table Exists. Last 5 rows:", notifs);
        } catch (e) {
            console.log("Notifications Table Query Error:", e.message);
        }

        // Check projects
        const [projects] = await db.query("SELECT project_id, project_name, manager_id, status, budget FROM projects LIMIT 5");
        console.log("Projects in DB:", projects);

        // Check tasks
        const [tasks] = await db.query("SELECT task_id, task_name, project_id, status FROM tasks LIMIT 5");
        console.log("Tasks in DB:", tasks);

        // Check users
        const [users] = await db.query("SELECT id, name, email, role FROM users LIMIT 5");
        console.log("Users in DB:", users);

        process.exit(0);
    } catch (err) {
        console.error("Diagnostic failed:", err);
        process.exit(1);
    }
}
checkDb();
