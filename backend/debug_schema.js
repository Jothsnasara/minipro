const db = require('./config/db');

function query(sql, params) {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
}

async function checkSchema() {
    try {
        console.log("--- Checking 'tasks' table ---");
        try {
            const tasksCols = await query("SHOW COLUMNS FROM tasks");
            console.log("Tasks columns:", tasksCols.map(c => c.Field).join(", "));
        } catch (e) {
            console.error("Error checking tasks table:", e.message);
        }

        console.log("\n--- Checking 'activity_log' table ---");
        try {
            const activityCols = await query("SHOW COLUMNS FROM activity_log");
            console.log("Activity Log columns:", activityCols.map(c => c.Field).join(", "));
        } catch (e) {
            console.error("Error checking activity_log table (it might not exist):", e.message);
        }

        process.exit(0);
    } catch (error) {
        console.error("Unexpected error:", error);
        process.exit(1);
    }
}

checkSchema();
