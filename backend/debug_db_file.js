const mysql = require("mysql2");
const fs = require("fs");
require("dotenv").config({ path: "./.env" });

const logFile = "debug_output.txt";
const log = (msg) => {
    console.log(msg);
    fs.appendFileSync(logFile, msg + "\n");
};

log("Starting DB Debug Script...");

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect(err => {
    if (err) {
        log("DB connection error: " + err.message);
        process.exit(1);
    }
    log("Connected to DB");

    // 1. List Managers
    db.query("SELECT id, name, username, role, status FROM users WHERE role = 'manager'", (err, managers) => {
        if (err) {
            log("Error fetching managers: " + err.message);
        } else {
            log("\n--- Managers ---");
            log(JSON.stringify(managers, null, 2));
        }

        // 2. List Projects
        db.query("SELECT id, project_name, manager_id FROM projects", (err, projects) => {
            if (err) {
                log("Error fetching projects: " + err.message);
            } else {
                log("\n--- Projects ---");
                log(JSON.stringify(projects, null, 2));
            }

            log("Closing connection...");
            db.end();
            process.exit(0);
        });
    });
});
