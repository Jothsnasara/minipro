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
    console.log("DB CONNECTED");

    db.query("SHOW TABLES", (err, res) => {
        if (err) console.error("QUERY ERROR: " + err.message);
        else {
            console.log("TABLES:");
            console.log(JSON.stringify(res));
        }
        db.end();
    });
});
