const db = require('./config/db');

function query(sql, params) {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
}

async function fixMemberDB() {
    try {
        console.log("--- Starting Member Dashboard DB Fix ---");

        // 1. Check/Add 'progress' to 'tasks'
        console.log("Checking 'progress' column in 'tasks' table...");
        const tasksCols = await query("SHOW COLUMNS FROM tasks");
        const hasProgress = tasksCols.some(c => c.Field === 'progress');

        if (!hasProgress) {
            console.log("Adding 'progress' column to 'tasks' table...");
            await query("ALTER TABLE tasks ADD COLUMN progress INT DEFAULT 0");
            console.log("✅ 'progress' column added successfully.");
        } else {
            console.log("ℹ️ 'progress' column already exists.");
        }

        // 2. Check/Create 'activity_log'
        console.log("Checking 'activity_log' table...");
        try {
            await query("SELECT 1 FROM activity_log LIMIT 1");
            console.log("ℹ️ 'activity_log' table already exists.");
        } catch (e) {
            console.log("Creating 'activity_log' table...");
            await query(`
                CREATE TABLE IF NOT EXISTS activity_log (
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
            console.log("✅ 'activity_log' table created successfully.");
        }

        console.log("\n🎉 Database fix completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("\n❌ Database fix failed:", error.message);
        process.exit(1);
    }
}

fixMemberDB();
