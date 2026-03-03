const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const logFile = path.join(__dirname, 'ULTRA_FIX_LOG.txt');
let logContent = "";

function log(msg) {
    console.log(msg);
    logContent += msg + "\n";
}

async function run() {
    log("Starting Ultra Fix at " + new Date().toISOString());
    log("Environment Variables:");
    log("DB_HOST: " + process.env.DB_HOST);
    log("DB_USER: " + process.env.DB_USER);
    log("DB_NAME: " + process.env.DB_NAME);

    const connection = mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    const db = connection.promise();

    try {
        // 1. Check current database
        const [dbRows] = await db.query("SELECT DATABASE() as db");
        log("Connected to database: " + dbRows[0].db);

        // 2. Check if tasks table exists
        const [tables] = await db.query("SHOW TABLES LIKE 'tasks'");
        if (tables.length === 0) {
            log("❌ ERROR: 'tasks' table does not exist in the current database!");
        } else {
            log("✅ 'tasks' table found.");

            // 3. Check columns
            const [columns] = await db.query("SHOW COLUMNS FROM tasks");
            const hasProgress = columns.some(c => c.Field === 'progress');
            log("Columns in 'tasks': " + columns.map(c => c.Field).join(", "));

            if (!hasProgress) {
                log("Adding 'progress' column...");
                await db.query("ALTER TABLE tasks ADD COLUMN progress INT DEFAULT 0");
                log("✅ Column 'progress' added.");
            } else {
                log("ℹ️ Column 'progress' already exists.");
            }
        }

        // 4. Verify activity_log
        const [actTables] = await db.query("SHOW TABLES LIKE 'activity_log'");
        if (actTables.length === 0) {
            log("Creating 'activity_log' table...");
            await db.query(`
                CREATE TABLE activity_log (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    user_id INT NOT NULL,
                    task_id INT,
                    action VARCHAR(255) NOT NULL,
                    details TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            log("✅ 'activity_log' created.");
        } else {
            log("✅ 'activity_log' exists.");
        }

        log("🎉 SUCCESS: Database schema is now synchronized.");

    } catch (err) {
        log("❌ FATAL ERROR: " + err.message);
        log(err.stack);
    } finally {
        fs.writeFileSync(logFile, logContent);
        connection.end();
        process.exit(0);
    }
}

run();
