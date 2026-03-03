const db = require('./config/db');
const fs = require('fs');
const path = require('path');

const reportFile = path.join(__dirname, 'DB_REPORT.txt');

function query(sql, params) {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
}

async function run() {
    let report = "DB Report started at: " + new Date().toISOString() + "\n";
    try {
        // 1. Check Triggers
        report += "\n--- Triggers on 'tasks' ---\n";
        const triggers = await query("SHOW TRIGGERS LIKE 'tasks'");
        triggers.forEach(t => report += `Trigger: ${t.Trigger}, Event: ${t.Event}, Timing: ${t.Timing}\n`);

        // 2. Check task 'UI' details
        report += "\n--- Task 'UI' Details ---\n";
        const tasks = await query("SELECT t.*, p.status as project_status FROM tasks t JOIN projects p ON t.project_id = p.project_id WHERE t.task_name = 'UI'");
        tasks.forEach(t => {
            report += `TaskID: ${t.task_id}, Status: ${t.status}, Progress: ${t.progress}, ProjectStatus: ${t.project_status}\n`;
        });

        report += "\n🎉 Report finished.";
    } catch (err) {
        report += "\n❌ ERROR: " + err.message + "\n";
    }
    fs.writeFileSync(reportFile, report);
    process.exit(0);
}

run();
