const db = require("../config/db");
const { createAndSendNotification } = require("../services/notificationService");

exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;

        // --- NEW: Trigger 4 - Check approaching deadlines (<= 3 days) ---
        if (req.user.role === 'manager') {
            const [projects] = await db.query(
                "SELECT project_id, project_name, end_date FROM projects WHERE manager_id = ? AND status != 'Completed' AND end_date IS NOT NULL",
                [userId]
            );
            
            const now = new Date();
            for (let p of projects) {
                const endDate = new Date(p.end_date);
                const diffTime = endDate - now;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                if (diffDays >= 0 && diffDays <= 3) {
                    const [existing] = await db.query(
                        "SELECT notification_id FROM notifications WHERE user_id = ? AND type = 'warning' AND project_name = ? AND title = 'Deadline Approaching' AND is_read = FALSE",
                        [userId, p.project_name]
                    );
                    
                    if (existing.length === 0) {
                        await createAndSendNotification(
                            userId,
                            "Deadline Approaching",
                            `Project "${p.project_name}" is due in ${diffDays} day(s)!`,
                            'warning',
                            p.project_name
                        );
                    }
                }
            }
        }

        const [notifications] = await db.query(
            "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC",
            [userId]
        );
        res.status(200).json(notifications);
    } catch (err) {
        console.error("Error fetching notifications:", err.message);
        res.status(500).json({ error: "Failed to fetch notifications." });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        await db.query(
            "UPDATE notifications SET is_read = TRUE WHERE notification_id = ? AND user_id = ?",
            [id, userId]
        );
        res.status(200).json({ message: "Notification marked as read." });
    } catch (err) {
        console.error("Error marking notification as read:", err.message);
        res.status(500).json({ error: "Failed to update notification." });
    }
};

exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        await db.query(
            "UPDATE notifications SET is_read = TRUE WHERE user_id = ?",
            [userId]
        );
        res.status(200).json({ message: "All notifications marked as read." });
    } catch (err) {
        console.error("Error marking all notifications as read:", err.message);
        res.status(500).json({ error: "Failed to update notifications." });
    }
};
