const mysql = require('mysql2/promise');
require('dotenv').config();

async function check() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    const [projects] = await connection.query("SELECT project_id, project_name FROM projects WHERE project_name LIKE '%Food delivery%'");
    console.log("PROJECTS:", projects);

    const [tables] = await connection.query("SHOW TABLES");
    console.log("TABLES:", tables);

    await connection.end();
}
check().catch(console.error);
