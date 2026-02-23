const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

async function dumpSchema() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    let output = "";

    const [tables] = await connection.query("SHOW TABLES");
    output += "TABLES:\n" + JSON.stringify(tables, null, 2) + "\n";

    for (const table of tables) {
        const tableName = Object.values(table)[0];
        output += `\nDESCRIBE ${tableName}:\n`;
        const [desc] = await connection.query(`DESCRIBE ${tableName}`);
        output += JSON.stringify(desc, null, 2) + "\n";
    }

    const [triggers] = await connection.query("SHOW TRIGGERS");
    output += "\nTRIGGERS:\n" + JSON.stringify(triggers, null, 2) + "\n";

    fs.writeFileSync('schema_dump.json', output);
    await connection.end();
}

dumpSchema().catch(console.error);
