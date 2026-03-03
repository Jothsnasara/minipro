const mysql = require('mysql2');
require('dotenv').config();

console.log("Connecting to:", process.env.DB_HOST, "as", process.env.DB_USER);

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

connection.connect(err => {
    if (err) {
        console.error("Connection failed:", err.message);
        process.exit(1);
    }
    console.log("Connected successfully!");
    connection.query('SELECT 1 + 1 AS solution', (err, rows) => {
        if (err) {
            console.error("Query failed:", err.message);
            process.exit(1);
        }
        console.log("Query success! Solution:", rows[0].solution);
        connection.end();
        process.exit(0);
    });
});
