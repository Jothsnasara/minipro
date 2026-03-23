require('dotenv').config();
const db = require('./config/db');

async function seedNotifications() {
    try {
        // Need a user to assign notifications to. Let's find the first manager or member.
        const [users] = await db.query("SELECT id FROM users LIMIT 1");
        if (users.length === 0) {
            console.log("No users found to seed notifications for.");
            process.exit(1);
        }
        const userId = users[0].id;

        const notifications = [
            {
                user_id: userId,
                title: "Budget Exceeded",
                message: "Project \"E-Commerce Platform\" has exceeded its budget by 15%",
                type: "critical",
                project_name: "E-Commerce Platform",
                created_at: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
            },
            {
                user_id: userId,
                title: "Deadline Approaching",
                message: "Task \"Database Migration\" is due in 3 days",
                type: "warning",
                project_name: "",
                created_at: new Date(Date.now() - 5 * 60 * 60 * 1000) // 5 hours ago
            },
            {
                user_id: userId,
                title: "Task Completed",
                message: "Mike Johnson completed \"API Integration\"",
                type: "success",
                project_name: "",
                created_at: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
            },
            {
                user_id: userId,
                title: "New Team Member",
                message: "Sarah Williams has been added to \"Website Redesign\" project",
                type: "info",
                project_name: "",
                created_at: new Date(Date.now() - 48 * 60 * 60 * 1000) // 2 days ago
            },
            {
                user_id: userId,
                title: "Resource Conflict",
                message: "Server capacity is at 95% - consider scaling up",
                type: "critical",
                project_name: "",
                created_at: new Date(Date.now() - 48 * 60 * 60 * 1000) // 2 days ago
            },
            {
                user_id: userId,
                title: "Progress Update",
                message: "Website Redesign project is now 75% complete",
                type: "info",
                project_name: "",
                created_at: new Date(Date.now() - 72 * 60 * 60 * 1000) // 3 days ago
            }
        ];

        // Ensure table exists first
        await db.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                notification_id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                type ENUM('critical', 'warning', 'success', 'info') DEFAULT 'info',
                project_name VARCHAR(255),
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        for (const n of notifications) {
            await db.query(
                "INSERT INTO notifications (user_id, title, message, type, project_name, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                [n.user_id, n.title, n.message, n.type, n.project_name, n.created_at]
            );
        }

        console.log("Seeded dummy notifications successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Failed to seed notifications:", err);
        process.exit(1);
    }
}

seedNotifications();
