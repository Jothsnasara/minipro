const express = require("express");
const router = express.Router();
const db = require('../config/db');

const {
    getAllProjects,
    createProject,
    getManagerProjects,
    getManagerTeamMembers,
    getUnfilledProjects,
    completeProject,
    createTask,
    assignMemberToProject,
    getProjectMembers
} = require("../controllers/projectController");

// --- 1. SPECIAL MANAGER ROUTES ---

// FETCH PROJECTS ASSIGNED BUT NOT YET DETAILED
router.get('/manager/:managerId/unfilled-projects', async (req, res) => {
    const managerId = req.params.managerId;
    try {
        // This will now work because of the pool.promise() change in db.js
        const [rows] = await db.query(
            "SELECT project_id, project_name FROM projects WHERE manager_id = ? AND status = 'Planning'",
            [managerId]
        );
        res.json(rows);
    } catch (err) {
        console.error("Backend Error fetching unfilled:", err.message);
        res.status(500).json({ error: "Database error: " + err.message });
    }
});

// GET TEAM MEMBERS COUNT
router.get("/manager/:managerId/team-members", getManagerTeamMembers);

// --- 2. GENERAL MANAGER ROUTES ---

// FETCH ALL PROJECTS FOR A MANAGER
router.get("/manager/:managerId", getManagerProjects);

// --- 3. GLOBAL PROJECT ROUTES ---

router.get("/", getAllProjects);
router.post("/", createProject);
router.post("/tasks", createTask);

// --- 4. ACTION ROUTES ---

// COMPLETE THE PROJECT AND SET TO ACTIVE
router.put('/complete-project/:id', async (req, res) => {
    const projectId = req.params.id;
    const { description, budget, start_date, end_date } = req.body;
    try {
        const sql = `
            UPDATE projects 
            SET description = ?, budget = ?, start_date = ?, end_date = ?, status = 'Active' 
            WHERE project_id = ?
        `;
        const [result] = await db.query(sql, [description, budget, start_date, end_date, projectId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Project not found or already updated." });
        }
        res.json({ message: "Project details updated and status set to Active!" });
    } catch (err) {
        console.error("Backend Error updating project:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// PROJECT MEMBERS
router.post("/:projectId/members", assignMemberToProject);
router.get("/:projectId/members", getProjectMembers);

module.exports = router;
