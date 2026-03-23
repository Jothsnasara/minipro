require('dotenv').config();
const db = require('./config/db');

async function syncData() {
    try {
        console.log("Wiping old dummy notifications...");
        await db.query("DELETE FROM notifications");

        console.log("Syncing existing projects...");
        const [projects] = await db.query("SELECT project_id, project_name, manager_id FROM projects");
        for (let p of projects) {
            // Notify Admin
            const [admins] = await db.query("SELECT id FROM users WHERE role = 'admin'");
            for (let a of admins) {
                await db.query(
                    "INSERT INTO notifications (user_id, title, message, type, project_name) VALUES (?, ?, ?, ?, ?)",
                    [a.id, "Project Tracked", `Project "${p.project_name}" is currently being tracked.`, 'info', p.project_name]
                );
            }
            // Notify Manager
            if (p.manager_id) {
                await db.query(
                    "INSERT INTO notifications (user_id, title, message, type, project_name) VALUES (?, ?, ?, ?, ?)",
                    [p.manager_id, "Project Assigned", `You are managing ${p.project_name}.`, 'info', p.project_name]
                );
            }
        }

        console.log("Syncing existing tasks...");
        const [tasks] = await db.query(`
            SELECT t.task_name, t.assigned_to, t.status, p.project_name, p.manager_id 
            FROM tasks t
            JOIN projects p ON t.project_id = p.project_id
        `);
        for (let t of tasks) {
            if (t.assigned_to) {
                await db.query(
                    "INSERT INTO notifications (user_id, title, message, type, project_name) VALUES (?, ?, ?, ?, ?)",
                    [t.assigned_to, "Task Assigned", `You are assigned to task: "${t.task_name}".`, 'info', t.project_name]
                );
            }
            if (t.status === 'Completed' && t.manager_id) {
                await db.query(
                    "INSERT INTO notifications (user_id, title, message, type, project_name) VALUES (?, ?, ?, ?, ?)",
                    [t.manager_id, "Task Completed", `Task "${t.task_name}" is completed.`, 'success', t.project_name]
                );
            }
        }

        console.log("Syncing existing bottlenecks (dummy resource conflict)...");
        if (projects.length > 0 && projects[0].manager_id) {
             await db.query(
                    "INSERT INTO notifications (user_id, title, message, type, project_name) VALUES (?, ?, ?, ?, ?)",
                    [projects[0].manager_id, "Budget Warning", `Check budget allocations for "${projects[0].project_name}".`, 'warning', projects[0].project_name]
                );
        }

        console.log("Synchronization complete! Database notifications are now based purely on the existing projects.");
        process.exit(0);
    } catch (err) {
        console.error("Failed to sync:", err);
        process.exit(1);
    }
}
syncData();
