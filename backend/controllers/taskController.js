const db = require('../config/db');

// Helper: promisify MySQL queries
const query = (sql, params) => new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
        if (err) reject(err);
        else resolve(results);
    });
});

// ─────────────────────────────────────────────
// GET /api/projects → all projects (still uses projectRoutes for main list)
// This stays for compatibility; main project APIs are in projectController
// ─────────────────────────────────────────────
exports.getProjects = async (req, res) => {
    try {
        const projects = await query('SELECT * FROM projects ORDER BY created_at DESC');
        res.json(projects);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────
// GET /api/users → all users from MySQL
// ─────────────────────────────────────────────
exports.getUsers = async (req, res) => {
    try {
        const users = await query(
            `SELECT id, name, email, role, status FROM users WHERE status = 'Active' ORDER BY name ASC`
        );
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────
// GET /api/projects/:projectId/tasks → tasks for a project
// ─────────────────────────────────────────────
exports.getTasksByProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        const tasks = await query(
            `SELECT t.*, u.name AS assigned_name
             FROM tasks t
             LEFT JOIN users u ON t.assigned_to = u.id
             WHERE t.project_id = ?
             ORDER BY t.created_at DESC`,
            [projectId]
        );
        // Normalise field names to match what the frontend expects
        const formatted = tasks.map(t => ({
            _id: t.task_id,
            title: t.task_name,
            assignedTo: { name: t.assigned_name || 'Unassigned' },
            priority: t.priority,
            status: t.status === 'Pending' ? 'Todo' : t.status,
            dueDate: t.due_date,
            estimatedHours: Number(t.estimated_hours) || 0,
            resources: t.resources ? t.resources.split(',').map(r => r.trim()) : [],
            projectId: t.project_id,
            createdAt: t.created_at
        }));
        res.json(formatted);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────
// POST /api/tasks → create a new task
// ─────────────────────────────────────────────
exports.createTask = async (req, res) => {
    try {
        const { title, assignedTo, priority, status, dueDate, estimatedHours, resources, projectId } = req.body;

        if (!title || !projectId) {
            return res.status(400).json({ message: 'title and projectId are required' });
        }

        // Convert frontend status to DB enum
        const dbStatus = status === 'Todo' ? 'Pending' : (status || 'Pending');
        // Map assignedTo name back to user id
        let assignedUserId = null;
        if (assignedTo) {
            const users = await query('SELECT id FROM users WHERE name = ? LIMIT 1', [assignedTo]);
            if (users.length) assignedUserId = users[0].id;
        }

        const resourceStr = Array.isArray(resources)
            ? resources.join(',')
            : (resources || '');

        const result = await query(
            `INSERT INTO tasks (project_id, task_name, assigned_to, priority, status, due_date, estimated_hours, resources)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                projectId,
                title,
                assignedUserId,
                priority || 'Medium',
                dbStatus,
                dueDate || null,
                Number(estimatedHours) || 0,
                resourceStr
            ]
        );

        res.status(201).json({ message: 'Task created', task_id: result.insertId });
    } catch (error) {
        // Catch trigger errors (completed project)
        if (error.code === 'ER_SIGNAL_EXCEPTION') {
            return res.status(400).json({ message: error.sqlMessage });
        }
        res.status(400).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────
// PUT /api/tasks/:id → update a task
// ─────────────────────────────────────────────
exports.updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, status, priority, dueDate, estimatedHours, resources, assignedTo } = req.body;

        const dbStatus = status === 'Todo' ? 'Pending' : (status || 'Pending');

        let assignedUserId = null;
        if (assignedTo) {
            const users = await query('SELECT id FROM users WHERE name = ? LIMIT 1', [assignedTo]);
            if (users.length) assignedUserId = users[0].id;
        }

        const resourceStr = Array.isArray(resources)
            ? resources.join(',')
            : (resources || '');

        await query(
            `UPDATE tasks SET task_name = ?, status = ?, priority = ?, due_date = ?, estimated_hours = ?, resources = ?, assigned_to = ?
             WHERE task_id = ?`,
            [title, dbStatus, priority || 'Medium', dueDate || null, Number(estimatedHours) || 0, resourceStr, assignedUserId, id]
        );

        res.json({ message: 'Task updated' });
    } catch (error) {
        if (error.code === 'ER_SIGNAL_EXCEPTION') {
            return res.status(400).json({ message: error.sqlMessage });
        }
        res.status(400).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────
// DELETE /api/tasks/:id → delete a task
// ─────────────────────────────────────────────
exports.deleteTask = async (req, res) => {
    try {
        await query('DELETE FROM tasks WHERE task_id = ?', [req.params.id]);
        res.json({ message: 'Task deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────
// GET /api/dashboard/summary/:projectId
// ─────────────────────────────────────────────
exports.getSummaryData = async (req, res) => {
    try {
        const { projectId } = req.params;
        const [row] = await query(
            `SELECT 
               COUNT(*) AS totalTasks,
               SUM(status = 'Completed') AS completedTasks,
               COUNT(DISTINCT assigned_to) AS teamMembers,
               COALESCE(SUM(estimated_hours), 0) AS totalEstHours
             FROM tasks WHERE project_id = ?`,
            [projectId]
        );

        res.json({
            totalTasks: row.totalTasks || 0,
            completedTasks: row.completedTasks || 0,
            teamMembers: row.teamMembers || 0,
            totalEstHours: Number(row.totalEstHours) || 0
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────
// GET /api/dashboard/team-workload/:projectId
// ─────────────────────────────────────────────
exports.getWorkloadData = async (req, res) => {
    try {
        const { projectId } = req.params;
        const rows = await query(
            `SELECT 
               u.name,
               SUM(t.status != 'Completed') AS activeTasks,
               COALESCE(SUM(t.estimated_hours), 0) AS allocatedHours
             FROM tasks t
             JOIN users u ON t.assigned_to = u.id
             WHERE t.project_id = ?
             GROUP BY u.id, u.name`,
            [projectId]
        );

        const workload = rows.map(r => ({
            name: r.name,
            activeTasks: Number(r.activeTasks),
            allocatedHours: Number(r.allocatedHours),
            avatar: r.name.split(' ').map(n => n[0]).join('').toUpperCase()
        }));

        res.json(workload);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────
// GET /api/dashboard/resource-usage/:projectId
// ─────────────────────────────────────────────
exports.getResourceUsage = async (req, res) => {
    try {
        const { projectId } = req.params;
        const tasks = await query(
            'SELECT resources FROM tasks WHERE project_id = ? AND resources IS NOT NULL AND resources != ""',
            [projectId]
        );

        const resourceMap = {};
        tasks.forEach(task => {
            task.resources.split(',').forEach(r => {
                const name = r.trim();
                if (name) resourceMap[name] = (resourceMap[name] || 0) + 1;
            });
        });

        const usage = Object.entries(resourceMap).map(([name, taskCount]) => ({ name, taskCount }));
        res.json(usage);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
