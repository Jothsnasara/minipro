const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

async function dump() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    const [tables] = await connection.query("SHOW TABLES");
    const [projects] = await connection.query("SELECT project_id, project_name FROM projects");

    fs.writeFileSync('db_data.json', JSON.stringify({ tables, projects }, null, 2));
    await connection.end();
}
dump().catch(console.error);
