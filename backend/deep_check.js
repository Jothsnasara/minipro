const db = require('./config/db');
const fs = require('fs');

function query(sql, params) {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
}

async function run() {
    let log = "Deep Check started\n";
    try {
        // 1. Find Asi
        const users = await query("SELECT id, name FROM users WHERE name LIKE '%asi%'");
        log += `Found ${users.length} users matching 'asi'\n`;
        users.forEach(u => log += `  - ID: ${u.id}, Name: ${u.name}\n`);

        const asiId = users[0]?.id;

        // 2. Check tasks assigned to Asi
        if (asiId) {
            const tasks = await query("SELECT task_id, task_name, assigned_to FROM tasks WHERE assigned_to = ?", [asiId]);
            log += `Found ${tasks.length} tasks assigned to ID ${asiId}\n`;
            tasks.forEach(t => log += `  - TaskID: ${t.task_id}, Name: ${t.task_name}, AssignedTo: ${t.assigned_to}\n`);
        }

        // 3. Check for tasks with 'UI' in the name and their assignments
        const uiTasks = await query("SELECT task_id, task_name, assigned_to FROM tasks WHERE task_name LIKE '%UI%'");
        log += `Found ${uiTasks.length} tasks matching 'UI'\n`;
        uiTasks.forEach(t => log += `  - TaskID: ${t.task_id}, Name: ${t.task_name}, AssignedTo: ${t.assigned_to}\n`);

        // 4. Check activity_log schema specifically for NOT NULL
        const activityCols = await query("DESCRIBE activity_log");
        log += "\n--- activity_log columns ---\n";
        activityCols.forEach(c => log += `${c.Field}: ${c.Type} Null=${c.Null}\n`);

    } catch (err) {
        log += "❌ ERROR: " + err.message + "\n";
    }

    // Write to a file in the CURRENT directory
    fs.writeFileSync('DEEP_LOG.txt', log);
    console.log(log);
    process.exit(0);
}

run();
