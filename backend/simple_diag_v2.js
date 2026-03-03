const db = require('./config/db');
const fs = require('fs');
const path = require('path');

const reportPath = 'd:\\minipro\\backend\\SIMPLE_REPORT.txt';

async function run() {
    let report = "Start: " + new Date().toISOString() + "\n";
    try {
        // Query projects
        const [projects] = await new Promise((resolve, reject) => {
            db.query("SELECT project_name, status FROM projects", (err, res) => {
                if (err) reject(err); else resolve([res]);
            });
        });

        report += "--- PROJECTS ---\n";
        projects.forEach(p => report += `${p.project_name}: ${p.status}\n`);

        // Query tasks
        const [tasks] = await new Promise((resolve, reject) => {
            db.query("SELECT task_id, task_name, assigned_to, status, progress, project_id FROM tasks WHERE task_name LIKE '%UI%'", (err, res) => {
                if (err) reject(err); else resolve([res]);
            });
        });

        report += "\n--- TASKS ---\n";
        tasks.forEach(t => report += `ID: ${t.task_id}, Name: ${t.task_name}, AssignedTo: ${t.assigned_to}, Status: ${t.status}, Progress: ${t.progress}, ProjectID: ${t.project_id}\n`);

        fs.writeFileSync(reportPath, report);
        process.exit(0);
    } catch (e) {
        fs.writeFileSync(reportPath, "ERROR: " + e.message + "\n" + e.stack);
        process.exit(1);
    }
}

run();
