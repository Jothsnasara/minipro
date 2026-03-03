const db = require('./config/db');

const query = (sql, params) => new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
        if (err) reject(err);
        else resolve(results);
    });
});

async function checkSchema() {
    try {
        const rows = await query('DESCRIBE tasks');
        console.log("Table Schema:");
        console.table(rows);
        process.exit(0);
    } catch (error) {
        console.error("Failed to check schema:", error);
        process.exit(1);
    }
}

checkSchema();
