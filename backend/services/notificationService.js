const db = require("../config/db");
const transporter = require("../config/mail");

exports.createAndSendNotification = async (userId, title, message, type, projectName = "") => {
    try {
        // 1. Insert into notifications table
        await db.query(
            "INSERT INTO notifications (user_id, title, message, type, project_name) VALUES (?, ?, ?, ?, ?)",
            [userId, title, message, type, projectName]
        );

        // 2. Fetch User Email
        const [users] = await db.query("SELECT name, email FROM users WHERE id = ?", [userId]);
        if (users.length === 0) return;

        const { name, email } = users[0];

        // 3. Send Email
        if (email) {
            let colorHex = "#2196f3"; // Info blue
            if (type === 'critical') colorHex = "#f44336"; // Red
            if (type === 'warning') colorHex = "#ff9800"; // Orange
            if (type === 'success') colorHex = "#4caf50"; // Green

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: `[ProjectPulse] ${title}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                        <h2 style="color: ${colorHex};">${title}</h2>
                        ${projectName ? `<p><strong>Project:</strong> ${projectName}</p>` : ''}
                        <p>${message}</p>
                        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                        <p style="font-size: 12px; color: #888;">This is an automated message from ProjectPulse. Log in to view details.</p>
                    </div>
                `
            };

            await transporter.sendMail(mailOptions);
        }
    } catch (err) {
        console.error("Failed to create/send notification:", err);
    }
};

exports.notifyAdmins = async (title, message, type, projectName = "") => {
    try {
        const [admins] = await db.query("SELECT id FROM users WHERE role = 'admin'");
        for (let admin of admins) {
            await this.createAndSendNotification(admin.id, title, message, type, projectName);
        }
    } catch (err) {
        console.error("Failed to notify admins:", err);
    }
};
