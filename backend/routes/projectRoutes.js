const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController");

// --- ADD MEMBER ROUTE ---
router.post('/:projectId/members', projectController.addProjectMember);

// --- MANAGER DASHBOARD ROUTES ---
router.get("/manager/:managerId", projectController.getManagerProjects);
router.get("/manager/:managerId/team-members", projectController.getManagerTeamMembersCount);
router.get("/manager/:managerId/unfilled-projects", projectController.getUnfilledProjects);

// --- GLOBAL PROJECT ROUTES ---
router.get("/", projectController.getAllProjects);
router.post("/", projectController.createProject);
router.post("/tasks", projectController.createTask);

// --- ACTION ROUTES ---
router.put('/complete-project/:id', projectController.completeProject);
router.get("/:projectId/members", projectController.getProjectMembers);

module.exports = router;