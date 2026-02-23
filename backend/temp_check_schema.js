const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkSchema() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    console.log("TABLES:");
    const [tables] = await connection.query("SHOW TABLES");
    console.log(tables);

    for (const table of tables) {
        const tableName = Object.values(table)[0];
        console.log(`\nDESCRIBE ${tableName}:`);
        const [desc] = await connection.query(`DESCRIBE ${tableName}`);
        console.table(desc);
    }

    await connection.end();
}

checkSchema().catch(console.error);
