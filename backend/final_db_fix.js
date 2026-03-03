const db = require('./config/db');
const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, 'FIX_SUCCESS.txt');

function query(sql, params) {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
}

async function fix() {
    let log = "Fix started at: " + new Date().toISOString() + "\n";
    try {
        // 1. Column check
        const cols = await query("SHOW COLUMNS FROM tasks");
        const hasProgress = cols.some(c => c.Field === 'progress');
        if (!hasProgress) {
            await query("ALTER TABLE tasks ADD COLUMN progress INT DEFAULT 0");
            log += "✅ Added 'progress' column to tasks\n";
        } else {
            log += "ℹ️ 'progress' column already exists\n";
        }

        // 2. Table check
        try {
            await query("DESCRIBE activity_log");
            log += "ℹ️ 'activity_log' table already exists\n";
        } catch (e) {
            await query(`
                CREATE TABLE activity_log (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    user_id INT NOT NULL,
                    task_id INT,
                    action VARCHAR(255) NOT NULL,
                    details TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (task_id) REFERENCES tasks(task_id) ON DELETE SET NULL
                )
            `);
            log += "✅ Created 'activity_log' table\n";
        }

        log += "🎉 ALL DONE!";
    } catch (err) {
        log += "❌ ERROR: " + err.message + "\n";
    }
    fs.writeFileSync(logFile, log);
    process.exit(0);
}

fix();
