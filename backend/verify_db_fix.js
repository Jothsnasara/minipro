const db = require('./config/db');

function query(sql, params) {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
}

async function verify() {
    try {
        const tasksCols = await query("SHOW COLUMNS FROM tasks");
        const statusCol = tasksCols.find(c => c.Field === 'status');
        const progressCol = tasksCols.find(c => c.Field === 'progress');

        console.log("--- Verification Results ---");
        console.log("Status Column:", statusCol ? statusCol.Type : "NOT FOUND");
        console.log("Progress Column:", progressCol ? "FOUND" : "NOT FOUND");

        try {
            await query("DESCRIBE activity_log");
            console.log("Activity Log Table: FOUND");
        } catch (e) {
            console.log("Activity Log Table: NOT FOUND");
        }

        process.exit(0);
    } catch (error) {
        console.error("Verification failed:", error);
        process.exit(1);
    }
}

verify();
