const db = require('./config/db');

const query = (sql, params) => new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
        if (err) reject(err);
        else resolve(results);
    });
});

async function verify() {
    try {
        console.log("Checking status for user 'asi'...");
        const users = await query("SELECT id, name, status FROM users WHERE name LIKE '%asi%'");

        if (users.length === 0) {
            console.log("❌ User 'asi' not found.");
        } else {
            const user = users[0];
            console.log(`User found: ${user.name} (ID: ${user.id}), Status: ${user.status}`);

            if (user.status !== 'Active') {
                console.log("Updating status to 'Active'...");
                await query("UPDATE users SET status = 'Active' WHERE id = ?", [user.id]);
                console.log("✅ Status updated successfully.");
            } else {
                console.log("✅ User is already 'Active'.");
            }
        }
        process.exit(0);
    } catch (error) {
        console.error("❌ Verification failed:", error);
        process.exit(1);
    }
}

verify();
