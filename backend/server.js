require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require('./config/db'); // 1. Move DB import to the top

const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// Logger middleware
app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    next();
});

// --- ROUTES ---

app.use("/projects", projectRoutes);
app.use("/", authRoutes);

// 2. The User Fetch Route (Keep this here or move to authRoutes)
app.get('/api/users', async (req, res) => {
    try {
        // This will now work perfectly once you've run the ALTER TABLE command in MySQL
        const [rows] = await db.query("SELECT id, username, specialization FROM users WHERE role = 'member'");
        res.json(rows);
    } catch (err) {
        console.error("Error in /api/users:", err.message);
        res.status(500).json({ error: "Database error: " + err.message });
    }
});

// --- SERVER START ---

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));