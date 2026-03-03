const db = require('./config/db');

const query = (sql, params) => new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
        if (err) reject(err);
        else resolve(results);
    });
});

async function findActiveMember() {
    try {
        const rows = await query("SELECT username, email, role, status FROM users WHERE role = 'member' AND status = 'Active' LIMIT 1");
        console.log("Active Member Found:");
        console.table(rows);
        process.exit(0);
    } catch (error) {
        console.error("Failed to find member:", error);
        process.exit(1);
    }
}

findActiveMember();
