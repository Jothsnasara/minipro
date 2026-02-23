const mysql = require("mysql2");
const fs = require('fs');
require("dotenv").config({ path: "./.env" });

const logFile = 'db_schema_log.txt';
// Clear log file
fs.writeFileSync(logFile, '');

const log = (msg) => {
    console.log(msg);
    fs.appendFileSync(logFile, (typeof msg === 'object' ? JSON.stringify(msg, null, 2) : msg) + '\n');
};

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect(err => {
    if (err) {
        log("DB ERROR: " + err.message);
        process.exit(1);
    }

    log("--- DESCRIBE projects ---");
    db.query("DESCRIBE projects", (err, result) => {
        if (err) log(err.message);
        else {
            log(result); // Will be JSON stringified
        }

        log("\n--- Checking Sara's Assignments ---");
        const username = 'Sara';
        db.query("SELECT id, name FROM users WHERE name = ? OR username = ?", [username, username], (err, users) => {
            if (err || users.length === 0) {
                log("User Sara not found");
                db.end();
                return;
            }
            const saraId = users[0].id;
            log(`Sara ID: ${saraId}`);

            db.query("SELECT id, project_name, manager_id, status FROM projects WHERE manager_id = ?", [saraId], (err, projects) => {
                if (err) log(err.message);
                else {
                    log(`Found ${projects.length} projects for Sara (ID: ${saraId}):`);
                    log(projects);
                }
                db.end();
            });
        });
    });
});
