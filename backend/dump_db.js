const mysql = require("mysql2");
const fs = require("fs");
require("dotenv").config({ path: "./.env" });

const outFile = "d:\\minipro\\backend\\db_dump.txt";

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect(err => {
    if (err) {
        fs.writeFileSync(outFile, "DB Connection Error: " + err.message);
        process.exit(1);
    }

    let output = "--- USERS ---\n";
    db.query("SELECT id, name, username, role FROM users", (err, users) => {
        if (err) output += "Error fetching users: " + err.message + "\n";
        else output += JSON.stringify(users, null, 2) + "\n";

        output += "\n--- PROJECTS ---\n";
        db.query("SELECT id, project_name, manager_id FROM projects", (err, projects) => {
            if (err) output += "Error fetching projects: " + err.message + "\n";
            else output += JSON.stringify(projects, null, 2) + "\n";

            fs.writeFileSync(outFile, output);
            console.log("Dump written to " + outFile);
            db.end();
            process.exit(0);
        });
    });
});
