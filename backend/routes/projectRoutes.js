const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController");
const { verifyToken, isManager, isAdmin } = require("../middleware/authMiddleware");

// --- RESOURCES & TEAM (Top Priority) ---
router.get("/resources/all", verifyToken, projectController.getAllResources);
router.get("/team-members/all", verifyToken, projectController.getAllTeamMembers);

// --- ADD MEMBER ROUTE ---
router.post('/:projectId/members', verifyToken, isManager, projectController.addProjectMember);

// --- MANAGER DASHBOARD ROUTES ---
router.get("/manager/:managerId", verifyToken, isManager, projectController.getManagerProjects);
router.get("/manager/:managerId/team-members", verifyToken, isManager, projectController.getManagerTeamMembersCount);
router.get("/manager/:managerId/unfilled-projects", verifyToken, isManager, projectController.getUnfilledProjects);

// --- GLOBAL PROJECT ROUTES ---
router.get("/", verifyToken, projectController.getAllProjects);
router.post("/", verifyToken, isAdmin, projectController.createProject);
router.post("/tasks", verifyToken, isManager, projectController.createTask);

// --- ACTION ROUTES ---
router.put('/complete-project/:id', verifyToken, isManager, projectController.completeProject);
router.get("/:projectId/members", verifyToken, projectController.getProjectMembers);
router.get("/:projectId/tasks", verifyToken, projectController.getProjectTasks);

module.exports = router;