const db = require('./config/db');
const fs = require('fs');

async function run() {
    try {
        const [projects] = await db.promise().query("SELECT project_name, status FROM projects");
        const [tasks] = await db.promise().query("SELECT task_id, task_name, assigned_to, status, progress FROM tasks WHERE task_name LIKE '%UI%'");

        let report = "--- PROJECTS ---\n";
        projects.forEach(p => report += `${p.project_name}: ${p.status}\n`);

        report += "\n--- TASKS ---\n";
        tasks.forEach(t => report += `ID: ${t.task_id}, Name: ${t.task_name}, AssignedTo: ${t.assigned_to}, Status: ${t.status}, Progress: ${t.progress}\n`);

        fs.writeFileSync('SIMPLE_REPORT.txt', report);
        console.log("Written SIMPLE_REPORT.txt");
        process.exit(0);
    } catch (e) {
        fs.writeFileSync('SIMPLE_REPORT.txt', "ERROR: " + e.message);
        process.exit(1);
    }
}

run();
