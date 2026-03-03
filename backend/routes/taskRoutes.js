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
    getUsers,
    getMemberStats,
    getMemberTasks,
    updateTaskMember,
    getMemberActivity
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

// Member Dashboard Routes
router.get('/member/stats/:userId', getMemberStats);
router.get('/member/tasks/:userId', getMemberTasks);
router.put('/member/tasks/:taskId', updateTaskMember);
router.get('/member/activity/:userId', getMemberActivity);

module.exports = router;
