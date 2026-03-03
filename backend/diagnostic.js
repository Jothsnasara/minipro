const db = require('./config/db');
const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, 'DIAGNOSTIC_LOG.txt');

function query(sql, params) {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
}

async function run() {
    let log = "Diagnostic started at: " + new Date().toISOString() + "\n";
    try {
        // 1. Check schemas
        log += "\n--- Tasks Table Schema ---\n";
        const tasksCols = await query("DESCRIBE tasks");
        tasksCols.forEach(c => log += `${c.Field}: ${c.Type} (${c.Null}, ${c.Key})\n`);

        log += "\n--- Activity Log Table Schema ---\n";
        try {
            const activityCols = await query("DESCRIBE activity_log");
            activityCols.forEach(c => log += `${c.Field}: ${c.Type} (${c.Null}, ${c.Key})\n`);
        } catch (e) {
            log += "activity_log table missing!\n";
        }

        // 2. Check for 'asi' user
        log += "\n--- User 'asi' ---\n";
        const users = await query("SELECT id, name, username, role, status FROM users WHERE name LIKE '%asi%' OR username LIKE '%asi%'");
        users.forEach(u => log += `ID: ${u.id}, Name: ${u.name}, Username: ${u.username}, Status: ${u.status}\n`);

        if (users.length > 0) {
            const asiId = users[0].id;
            log += "\n--- Tasks assigned to 'asi' ---\n";
            const tasks = await query("SELECT task_id, task_name, assigned_to, status, progress FROM tasks WHERE assigned_to = ?", [asiId]);
            tasks.forEach(t => log += `TaskID: ${t.task_id}, Name: ${t.task_name}, AssignedTo: ${t.assigned_to}, Status: ${t.status}, Progress: ${t.progress}\n`);

            if (tasks.length === 0) {
                log += "No tasks found assigned to this user ID.\n";
                // Try searching by name just in case
                const tasksByName = await query("SELECT task_id, task_name, assigned_to FROM tasks WHERE task_name LIKE '%asi%'");
                log += "Searching for tasks with 'asi' in the name...\n";
                tasksByName.forEach(t => log += `TaskID: ${t.task_id}, Name: ${t.task_name}\n`);
            }
        }

        log += "\n🎉 Diagnostic finished.";
    } catch (err) {
        log += "\n❌ ERROR: " + err.message + "\n";
        log += err.stack + "\n";
    }
    fs.writeFileSync(logFile, log);
    process.exit(0);
}

run();
