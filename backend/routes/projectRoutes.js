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
router.get("/manager/:managerId/progress", verifyToken, isManager, projectController.getManagerProgressData);

// --- GLOBAL PROJECT ROUTES ---
router.get("/", verifyToken, projectController.getAllProjects);
router.post("/", verifyToken, isAdmin, projectController.createProject);
router.post("/tasks", verifyToken, isManager, projectController.createTask);

// --- ACTION ROUTES ---
router.put('/complete-project/:id', verifyToken, isManager, projectController.completeProject);
router.get("/:projectId/members", verifyToken, projectController.getProjectMembers);
router.get("/:projectId/tasks", verifyToken, projectController.getProjectTasks);

// --- MEMBER DASHBOARD ROUTES ---
router.get("/member/dashboard/:memberId", verifyToken, projectController.getMemberDashboardData);
router.get("/member/progress/:memberId", verifyToken, projectController.getMemberProgressData);
router.put("/tasks/:taskId/progress", verifyToken, projectController.updateTaskProgress);
router.put("/tasks/:taskId/review", verifyToken, isManager, projectController.reviewTask);

module.exports = router;