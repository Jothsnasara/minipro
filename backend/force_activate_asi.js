const db = require('./config/db');

async function forceActivation() {
    console.log("Starting force activation for user 'Asi'...");

    const users = await new Promise((resolve, reject) => {
        db.query("SELECT id, name, username, status FROM users WHERE name LIKE '%asi%'", (err, res) => {
            if (err) reject(err);
            else resolve(res);
        });
    });

    if (users.length === 0) {
        console.log("❌ No user found matching 'Asi'.");
        process.exit(1);
    }

    const user = users[0];
    console.log(`Found user: ${user.name} (ID: ${user.id}), Current Status: ${user.status}`);

    if (user.status !== 'Active') {
        await new Promise((resolve, reject) => {
            db.query("UPDATE users SET status = 'Active' WHERE id = ?", [user.id], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        console.log("✅ Successfully updated status to 'Active'.");
    } else {
        console.log("ℹ️ User is already 'Active'.");
    }

    process.exit(0);
}

forceActivation().catch(err => {
    console.error("❌ Error during force activation:", err);
    process.exit(1);
});
