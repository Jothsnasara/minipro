const db = require('./config/db');

const query = (sql, params) => new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
        if (err) reject(err);
        else resolve(results);
    });
});

async function migrate() {
    try {
        console.log("Starting migration...");

        // Add progress column if it doesn't exist
        // Note: Using a slightly different approach for "IF NOT EXISTS" in MariaDB/MySQL ALTER
        try {
            await query(`ALTER TABLE tasks ADD COLUMN progress INT DEFAULT 0`);
            console.log("Added 'progress' column.");
        } catch (e) {
            if (e.code === 'ER_DUP_COLUMN_NAME') {
                console.log("'progress' column already exists.");
            } else {
                throw e;
            }
        }

        // Update status ENUM
        await query(`
            ALTER TABLE tasks 
            MODIFY COLUMN status ENUM('Pending', 'In Progress', 'Completed', 'Pending Review') DEFAULT 'Pending'
        `);
        console.log("Updated 'status' column ENUM values.");

        console.log("Migration completed successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

migrate();
