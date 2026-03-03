const db = require('./config/db');

const query = (sql, params) => new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
        if (err) reject(err);
        else resolve(results);
    });
});

async function migrate() {
    try {
        console.log("Starting activity_log migration...");

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
        console.log("Created 'activity_log' table.");

        console.log("Migration completed successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

migrate();
