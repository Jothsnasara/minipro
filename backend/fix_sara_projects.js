const mysql = require("mysql2");
require("dotenv").config({ path: "./.env" });

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect(err => {
    if (err) {
        console.error("DB ERROR: " + err.message);
        process.exit(1);
    }

    const username = 'Sara';

    // 1. Find Sara's ID
    db.query("SELECT id FROM users WHERE username = ? OR name = ?", [username, username], (err, users) => {
        if (err) {
            console.error("Query Error: " + err.message);
            db.end();
            return;
        }

        if (users.length === 0) {
            console.log(`User '${username}' not found. Cannot re-assign projects.`);
            db.end();
            return;
        }

        const saraId = users[0].id;
        console.log(`Found Sara with ID: ${saraId}. Assigning all projects to her...`);

        // 2. Update Projects
        db.query("UPDATE projects SET manager_id = ?", [saraId], (err, result) => {
            if (err) {
                console.error("Update Error: " + err.message);
            } else {
                console.log(`Updated ${result.affectedRows} projects to be assigned to Manager ID ${saraId}`);
            }
            db.end();
        });
    });
});
