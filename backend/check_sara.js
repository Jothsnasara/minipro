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

    const username = 'Sara'; // Case-sensitive check might be needed depending on collation

    db.query("SELECT * FROM users WHERE username = ? OR name = ?", [username, username], (err, users) => {
        if (err) {
            console.error("USER QUERY ERROR: " + err.message);
            db.end();
            return;
        }

        console.log(`Users found for '${username}':`);
        console.log(JSON.stringify(users, null, 2));

        if (users.length > 0) {
            const userId = users[0].id;
            console.log(`Checking projects for Manager ID: ${userId}`);

            db.query("SELECT * FROM projects WHERE manager_id = ?", [userId], (err, projects) => {
                if (err) console.error("PROJECT QUERY ERROR: " + err.message);
                else {
                    console.log(`Projects found for Manager ID ${userId}:`);
                    console.log(JSON.stringify(projects, null, 2));
                }
                db.end();
            });
        } else {
            console.log("User 'Sara' not found.");
            db.end();
        }
    });
});
