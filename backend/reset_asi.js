const db = require('./config/db');
const bcrypt = require('bcrypt');

async function reset() {
    try {
        const password = 'password123';
        const hashed = await bcrypt.hash(password, 10);

        db.query("SELECT username FROM users WHERE name LIKE '%asi%'", async (err, results) => {
            if (err || results.length === 0) {
                console.log("User not found");
                process.exit(1);
            }

            const username = results[0].username;
            db.query("UPDATE users SET password = ? WHERE username = ?", [hashed, username], (err) => {
                if (err) {
                    console.log("Update failed");
                    process.exit(1);
                }
                console.log(`CREDENTIALS_START`);
                console.log(`Username: ${username}`);
                console.log(`Password: ${password}`);
                console.log(`CREDENTIALS_END`);
                process.exit(0);
            });
        });
    } catch (e) {
        console.log(e);
        process.exit(1);
    }
}

reset();
