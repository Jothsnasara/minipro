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
    let output = "FINAL DIAGNOSTIC REPORT\n=======================\n";
    try {
        // 1. Projects
        output += "\nProjects:\n";
        const projects = await query("SELECT * FROM projects");
        projects.forEach(p => output += `ID: ${p.project_id}, Name: ${p.project_name}, Status: ${p.status}\n`);

        // 2. Tasks
        output += "\nTasks matching 'UI':\n";
        const tasks = await query("SELECT * FROM tasks WHERE task_name LIKE '%UI%'");
        tasks.forEach(t => output += `ID: ${t.task_id}, Name: ${t.task_name}, AssignedTo: ${t.assigned_to}, ProjectID: ${t.project_id}, Status: ${t.status}\n`);

        // 3. User 'Asi'
        output += "\nUser 'Asi':\n";
        const users = await query("SELECT * FROM users WHERE name LIKE '%asi%'");
        users.forEach(u => output += `ID: ${u.id}, Name: ${u.name}, Status: ${u.status}\n`);

        // 4. Activity Log Schema
        output += "\nActivity Log Schema:\n";
        const columns = await query("DESCRIBE activity_log");
        columns.forEach(c => output += `${c.Field}: ${c.Type}, Null: ${c.Null}\n`);

    } catch (e) {
        output += "\nERROR: " + e.message + "\n";
    }

    fs.writeFileSync('FINAL_REPORT.txt', output);
    console.log("Report written to FINAL_REPORT.txt");
    process.exit(0);
}

run();
