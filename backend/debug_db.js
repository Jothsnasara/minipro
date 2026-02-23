const mysql = require("mysql2");
require("dotenv").config({ path: "./.env" });

console.log("Starting DB Debug Script...");

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect(err => {
    if (err) {
        console.error("DB connection error:", err);
        process.exit(1);
    }
    console.log("Connected to DB");

    // 1. List Managers
    db.query("SELECT id, name, username, role, status FROM users WHERE role = 'manager'", (err, managers) => {
        if (err) {
            console.error("Error fetching managers:", err);
        } else {
            console.log("\n--- Managers ---");
            console.table(managers);
        }

        // 2. List Projects
        db.query("SELECT id, project_name, manager_id FROM projects", (err, projects) => {
            if (err) {
                console.error("Error fetching projects:", err);
            } else {
                console.log("\n--- Projects ---");
                console.table(projects);
            }

            console.log("Closing connection...");
            db.end();
            process.exit(0);
        });
    });
});
