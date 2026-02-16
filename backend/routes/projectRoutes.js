const express = require("express");
const router = express.Router();

const {
    getAllProjects,
    createProject
} = require("../controllers/projectController");

// GET /projects - Fetch all projects
router.get("/", getAllProjects);

// POST /projects - Create a new project
router.post("/", createProject);

module.exports = router;
