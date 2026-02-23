const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();
async function find() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });
    const [rows] = await db.query("SELECT project_id FROM projects WHERE project_name LIKE '%Food delivery%'");
    fs.writeFileSync('id.txt', JSON.stringify(rows));
    await db.end();
}
find();
