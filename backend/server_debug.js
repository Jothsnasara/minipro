require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const taskRoutes = require("./routes/taskRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    if (req.method === 'POST') console.log('Body:', req.body);
    next();
});

app.use("/projects", projectRoutes);
app.use("/api", taskRoutes);
app.use("/", authRoutes);

// Catch-all 404
app.use((req, res) => {
    const fullUrl = `${req.method} ${req.url}`;
    console.log(`[404 NOT FOUND] ${fullUrl}`);
    res.status(404).json({
        message: `Route not found: ${fullUrl}`,
        note: "Check server_debug.js to ensure routes are mounted correctly."
    });
});

const PORT = 5001;
app.listen(PORT, () => console.log(`Debug Server running on ${PORT}`));