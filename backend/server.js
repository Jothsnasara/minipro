require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require('./config/db'); // 1. Move DB import to the top

const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const { verifyToken } = require("./middleware/authMiddleware");

const app = express();

app.use(cors());
app.use(express.json());

// One-time Sync: Ensure all members and managers assigned to projects are 'Active'
// EXCEPT for those who have resigned (they must stay NULL)
const syncCleanup = db.query("UPDATE users SET status = NULL WHERE resign_date IS NOT NULL");

const syncMemberStatus = db.query(`
    UPDATE users 
    SET status = 'Active' 
    WHERE id IN (SELECT DISTINCT user_id FROM project_members)
    AND role = 'member' 
    AND (status IS NULL OR status = 'Inactive')
    AND resign_date IS NULL
`);

const syncManagerStatus = db.query(`
    UPDATE users 
    SET status = 'Active' 
    WHERE id IN (SELECT DISTINCT manager_id FROM projects WHERE manager_id IS NOT NULL)
    AND role = 'manager' 
    AND (status IS NULL OR status = 'Inactive')
    AND resign_date IS NULL
`);

Promise.all([syncCleanup, syncMemberStatus, syncManagerStatus])
    .then(() => console.log("[DB-SYNC] Active status synced (respecting resignations)."))
    .catch(err => console.error("[DB-SYNC] Sync failed:", err));

// Logger middleware
app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    next();
});

// --- ROUTES ---

app.use("/projects", projectRoutes);
app.use("/", authRoutes);
app.use("/api/notifications", notificationRoutes);

// 2. The User Fetch Route (Keep this here or move to authRoutes)
app.get('/api/users', verifyToken, async (req, res) => {
    try {
        // This will now work perfectly once you've run the ALTER TABLE command in MySQL
        const [rows] = await db.query("SELECT id, name, username, specialization, status FROM users WHERE role = 'member' AND resign_date IS NULL");
        res.json(rows);
    } catch (err) {
        console.error("Error in /api/users:", err.message);
        res.status(500).json({ error: "Database error: " + err.message });
    }
});

// --- SERVER START ---

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));