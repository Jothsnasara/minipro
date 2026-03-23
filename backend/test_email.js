require('dotenv').config();
const db = require('./config/db');
const { createAndSendNotification } = require('./services/notificationService');

async function testEmail() {
    try {
        const [users] = await db.query("SELECT id FROM users LIMIT 1");
        if (users.length > 0) {
            console.log("Found user, sending test notification...");
            await createAndSendNotification(
                users[0].id,
                "Test Trigger Initialization",
                "This is a test notification to verify the email and DB trigger system is online.",
                "success",
                "System Operations"
            );
            console.log("Test notification inserted and email dispatched (if valid email in DB).");
        } else {
            console.log("No users in DB to test with.");
        }
        process.exit(0);
    } catch (err) {
        console.error("Test failed:", err);
        process.exit(1);
    }
}
testEmail();
