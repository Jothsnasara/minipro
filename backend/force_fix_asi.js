const db = require('./config/db');
const fs = require('fs');
const path = require('path');

const logPath = path.join(__dirname, 'asi_activation_check.txt');

async function fix() {
    try {
        // 1. Update status
        await new Promise((resolve, reject) => {
            db.query("UPDATE users SET status = 'Active' WHERE name LIKE '%asi%' OR username LIKE '%asi%'", (err, res) => {
                if (err) reject(err);
                else resolve(res);
            });
        });

        // 2. Verify
        const users = await new Promise((resolve, reject) => {
            db.query("SELECT name, username, status FROM users WHERE name LIKE '%asi%' OR username LIKE '%asi%'", (err, res) => {
                if (err) reject(err);
                else resolve(res);
            });
        });

        const output = users.map(u => `Name: ${u.name}, Username: ${u.username}, Status: ${u.status}`).join('\n');
        fs.writeFileSync(logPath, output || "No user found");
        process.exit(0);
    } catch (e) {
        fs.writeFileSync(logPath, "ERROR: " + e.message);
        process.exit(1);
    }
}

fix();
