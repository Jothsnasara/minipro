require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    next();
});

app.use("/projects", projectRoutes);
app.use("/", authRoutes);

const PORT = 5001;
app.listen(PORT, () => console.log(`Debug Server running on ${PORT}`));