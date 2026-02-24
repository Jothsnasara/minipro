const express = require('express');
const router = express.Router();
const {
    getProjects,
    getSummaryData,
    createTask,
    getTasksByProject,
    updateTask,
    deleteTask,
    getWorkloadData,
    getResourceUsage,
    getUsers
} = require('../controllers/taskController');

// Project Routes
router.get('/projects', getProjects);
router.get('/users', getUsers);

// Task Routes
router.post('/tasks', createTask);
router.get('/projects/:projectId/tasks', getTasksByProject);
router.put('/tasks/:id', updateTask);
router.delete('/tasks/:id', deleteTask);

// Dashboard Routes
router.get('/dashboard/summary/:projectId', getSummaryData);
router.get('/dashboard/team-workload/:projectId', getWorkloadData);
router.get('/dashboard/resource-usage/:projectId', getResourceUsage);

module.exports = router;
