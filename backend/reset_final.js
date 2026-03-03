const db = require('./config/db');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

async function reset() {
    try {
        const password = 'password123';
        const hashedPassword = await bcrypt.hash(password, 10);

        db.query("SELECT username FROM users WHERE name LIKE '%asi%'", (err, results) => {
            if (err || results.length === 0) {
                fs.writeFileSync(path.join(__dirname, 'credentials.txt'), "User not found");
                process.exit(1);
            }

            const username = results[0].username;
            db.query("UPDATE users SET password = ?, status = 'Active' WHERE username = ?", [hashedPassword, username], (err) => {
                if (err) {
                    fs.writeFileSync(path.join(__dirname, 'credentials.txt'), "Update failed");
                    process.exit(1);
                }
                const output = `Username: ${username}\nPassword: ${password}`;
                fs.writeFileSync(path.join(__dirname, 'credentials.txt'), output);
                process.exit(0);
            });
        });
    } catch (e) {
        fs.writeFileSync(path.join(__dirname, 'credentials.txt'), e.message);
        process.exit(1);
    }
}

reset();
