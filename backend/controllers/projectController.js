const db = require("../config/db");
const { createAndSendNotification, notifyAdmins } = require("../services/notificationService");

/* ================= PROJECTS ================= */
exports.getAllProjects = async (req, res) => {
    try {
        const query = `
            SELECT 
                p.*, 
                u.name AS manager_name,
                (SELECT COUNT(*) FROM project_members pm WHERE pm.project_id = p.project_id) AS member_count
            FROM projects p
            LEFT JOIN users u ON p.manager_id = u.id
        `;
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: "Error fetching projects" });
    }
};

exports.getProjectById = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query("SELECT * FROM projects WHERE project_id = ?", [id]);
        if (rows.length === 0) return res.status(404).json({ message: "Project not found" });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ message: "Error fetching project" });
    }
};

exports.createProject = async (req, res) => {
    const { project_name, description, start_date, end_date, budget, manager_id, status } = req.body;
    try {
        const [result] = await db.query(
            "INSERT INTO projects (project_name, description, start_date, end_date, budget, manager_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [project_name, description || null, start_date || null, end_date || null, budget || null, manager_id, status || 'Planning']
        );

        // --- NEW: Automate PM Status Update ---
        if (manager_id) {
            await db.query("UPDATE users SET status = 'Active' WHERE id = ? AND resign_date IS NULL", [manager_id]);
            console.log(`[DB-SYNC] Manager ${manager_id} status set to Active (if not resigned).`);
        }

        res.status(201).json({ id: result.insertId, message: "Project created successfully" });

        // Trigger 1: Notify Admin & PM
        const msg = `New project "${project_name}" has been created.`;
        notifyAdmins("New Project Created", msg, 'info', project_name);
        if (manager_id) {
            createAndSendNotification(manager_id, "Project Assigned", `You have been assigned to manage ${project_name}.`, 'info', project_name);
        }
    } catch (err) {
        console.error("Failed to create project:", err);
        res.status(500).json({ message: "Error creating project", error: err.message });
    }
};

exports.updateProject = async (req, res) => {
    const { id } = req.params;
    const { project_name, description, start_date, end_date, price, status } = req.body;
    try {
        await db.query(
            "UPDATE projects SET project_name = ?, description = ?, start_date = ?, end_date = ?, price = ?, status = ? WHERE project_id = ?",
            [project_name, description, start_date, end_date, price, status, id]
        );
        res.json({ message: "Project updated successfully" });
    } catch (err) {
        res.status(500).json({ message: "Error updating project" });
    }
};

exports.deleteProject = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("DELETE FROM projects WHERE project_id = ?", [id]);
        res.json({ message: "Project deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Error deleting project" });
    }
};

/* ================= TASKS ================= */
exports.getTasksByProject = async (req, res) => {
    const { projectId } = req.params;
    try {
        const [rows] = await db.query(`
        SELECT t.*, u.name as assignee_name 
        FROM tasks t 
        LEFT JOIN users u ON t.assigned_to = u.id 
        WHERE t.project_id = ?
    `, [projectId]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: "Error fetching tasks" });
    }
};

exports.createTask = async (req, res) => {
    const { project_id, task_name, description, assigned_to, memberId, priority, due_date, status, estimated_hours, resources } = req.body;
    const final_assignee = assigned_to || memberId;
    try {
        const [result] = await db.query(
            "INSERT INTO tasks (project_id, task_name, description, assigned_to, priority, due_date, status, estimated_hours, resources) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [project_id, task_name, description, final_assignee, priority, due_date, status || 'Todo', estimated_hours, JSON.stringify(resources || [])]
        );

        // Set member status to Active when a task is assigned
        if (final_assignee) {
            await db.query(
                "INSERT IGNORE INTO project_members (project_id, user_id) VALUES (?, ?)",
                [project_id, final_assignee]
            );
            await db.query(
                "UPDATE users SET status = 'Active' WHERE id = ? AND resign_date IS NULL",
                [final_assignee]
            );
        }

        // --- NEW: Populate project_resource_allocations from task resources ---
        if (resources && Array.isArray(resources)) {
            for (const rName of resources) {
                try {
                    const [rRows] = await db.query("SELECT resource_id FROM resources WHERE resource_name = ?", [rName]);
                    if (rRows.length > 0) {
                        const rId = rRows[0].resource_id;
                        await db.query(
                            "INSERT IGNORE INTO project_resource_allocations (project_id, resource_id, allocated_units) VALUES (?, ?, 0)",
                            [project_id, rId]
                        );
                    }
                } catch (err) {
                    console.error("Allocating resource error:", err);
                }
            }
        }

        res.status(201).json({ task_id: result.insertId, message: "Task created successfully" });

        // Trigger 2: Notify Member
        if (final_assignee) {
            const [p] = await db.query("SELECT project_name FROM projects WHERE project_id = ?", [project_id]);
            const pName = p.length > 0 ? p[0].project_name : "Unknown Project";
            createAndSendNotification(
                final_assignee, 
                "New Task Assigned", 
                `You have been assigned a new task: "${task_name}". Due date: ${due_date || 'None'}`, 
                'info', 
                pName
            );
        }
    } catch (err) {
        console.error("CREATE TASK ERROR:", err);
        res.status(500).json({ message: "Error creating task" });
    }
};

/* ================= RESOURCES ================= */
exports.getAllResources = async (req, res) => {
    try {
        // Check if resources table exists
        let resources = [];
        try {
            const [rows] = await db.query("SELECT resource_id, resource_name FROM resources");
            resources = rows;
        } catch (_) {
            // resources table doesn't exist — return default project resources
        }

        if (resources.length === 0) {
            resources = [
                { resource_id: 1, resource_name: 'Figma' },
                { resource_id: 2, resource_name: 'Design System' },
                { resource_id: 3, resource_name: 'Backend Server' },
                { resource_id: 4, resource_name: 'Database' },
                { resource_id: 5, resource_name: 'DevOps Tools' },
                { resource_id: 6, resource_name: 'Cloud Server' },
                { resource_id: 7, resource_name: 'Documentation Tools' }
            ];
        }
        res.json(resources);
    } catch (err) {
        console.error("GET ALL RESOURCES ERROR:", err);
        res.status(500).json({ message: "Error fetching resources" });
    }
};

exports.getAllTeamMembers = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT id, name, email, role FROM users WHERE role = 'member' AND resign_date IS NULL");
        res.json(rows);
    } catch (err) {
        console.error("GET TEAM MEMBERS ERROR:", err);
        res.status(500).json({ message: "Error fetching team members" });
    }
};

/* ================= PROJECT MEMBERS ================= */
exports.getProjectMembers = async (req, res) => {
    const { projectId } = req.params;
    try {
        // Try project_members table first
        let members = [];
        try {
            const [rows] = await db.query(`
                SELECT u.id, u.name, u.email, u.specialization
                FROM users u
                JOIN project_members pm ON u.id = pm.user_id
                WHERE pm.project_id = ? AND u.resign_date IS NULL
            `, [projectId]);
            members = rows;
        } catch (dbErr) {
            console.error("[DEBUG] project_members query failed:", dbErr);
            // project_members table may not exist
        }

        // Fallback: get members who already have tasks in this project
        if (members.length === 0) {
            const [rows] = await db.query(`
                SELECT DISTINCT u.id, u.name, u.email, u.specialization
                FROM users u
                JOIN tasks t ON u.id = t.assigned_to
                WHERE t.project_id = ? AND u.resign_date IS NULL
            `, [projectId]);
            members = rows;
        }

        res.json(members);
    } catch (err) {
        console.error("GET PROJECT MEMBERS ERROR:", err);
        res.status(500).json({ message: "Error fetching project members" });
    }
};

exports.addProjectMember = async (req, res) => {
    const { projectId } = req.params;
    const { userId } = req.body;
    try {
        await db.query(
            "INSERT IGNORE INTO project_members (project_id, user_id) VALUES (?, ?)",
            [projectId, userId]
        );
        // Automatically set user status to Active when added to a project (if not resigned)
        await db.query("UPDATE users SET status = 'Active' WHERE id = ? AND resign_date IS NULL", [userId]);
        res.json({ message: "Member added to project and status set to Active" });

        // Trigger 8: Notify PM of New Member
        const [p] = await db.query("SELECT project_name, manager_id FROM projects WHERE project_id = ?", [projectId]);
        if (p.length > 0 && p[0].manager_id) {
            const [u] = await db.query("SELECT name FROM users WHERE id = ?", [userId]);
            const uName = u.length > 0 ? u[0].name : "A user";
            createAndSendNotification(
                p[0].manager_id,
                "New Team Member",
                `${uName} has been added to the project.`,
                'info',
                p[0].project_name
            );
        }
    } catch (err) {
        console.error("ADD PROJECT MEMBER ERROR:", err);
        res.status(500).json({ message: "Error adding member to project" });
    }
};

/* ================= TASKS ================= */
exports.getAllTasks = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT t.*, u.name as assignee_name, p.project_name
            FROM tasks t 
            LEFT JOIN users u ON t.assigned_to = u.id 
            LEFT JOIN projects p ON t.project_id = p.project_id
            ORDER BY t.task_id DESC
        `);
        res.json(rows);
    } catch (err) {
        console.error("GET ALL TASKS ERROR:", err);
        res.status(500).json({ message: "Error fetching all tasks" });
    }
};

exports.getProjectTasks = async (req, res) => {
    const { projectId } = req.params;
    try {
        const [rows] = await db.query(`
            SELECT t.*, u.name as assignee_name 
            FROM tasks t 
            LEFT JOIN users u ON t.assigned_to = u.id 
            WHERE t.project_id = ?
        `, [projectId]);
        res.json(rows);
    } catch (err) {
        console.error("GET PROJECT TASKS ERROR:", err);
        res.status(500).json({ message: "Error fetching tasks" });
    }
};

/* ================= MANAGER ROUTES ================= */
exports.getManagerProjects = async (req, res) => {
    const { managerId } = req.params;
    try {
        const query = `
            SELECT 
                p.*, 
                u.name AS manager_name,
                (SELECT COUNT(*) FROM project_members pm WHERE pm.project_id = p.project_id) AS member_count
            FROM projects p
            LEFT JOIN users u ON p.manager_id = u.id
            WHERE p.manager_id = ?
        `;
        const [rows] = await db.query(query, [managerId]);
        res.json(rows);
    } catch (err) {
        console.error("GET MANAGER PROJECTS ERROR:", err);
        res.status(500).json({ message: "Error fetching manager projects" });
    }
};

exports.getManagerTeamMembersCount = async (req, res) => {
    const { managerId } = req.params;
    try {
        const [rows] = await db.query(`
            SELECT COUNT(DISTINCT pm.user_id) as member_count
            FROM project_members pm
            JOIN projects p ON pm.project_id = p.project_id
            WHERE p.manager_id = ?
        `, [managerId]);
        res.json(rows[0]);
    } catch (err) {
        console.error("GET TEAM MEMBERS COUNT ERROR:", err);
        res.status(500).json({ message: "Error fetching team members count" });
    }
};

exports.getUnfilledProjects = async (req, res) => {
    const { managerId } = req.params;
    try {
        const [rows] = await db.query(
            "SELECT * FROM projects WHERE manager_id = ? AND status != 'Completed'",
            [managerId]
        );
        res.json(rows);
    } catch (err) {
        console.error("GET UNFILLED PROJECTS ERROR:", err);
        res.status(500).json({ message: "Error fetching unfilled projects" });
    }
};

exports.completeProject = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query(
            "UPDATE projects SET status = 'Completed' WHERE project_id = ?",
            [id]
        );
        res.json({ message: "Project marked as completed" });
    } catch (err) {
        console.error("COMPLETE PROJECT ERROR:", err);
        res.status(500).json({ message: "Error completing project" });
    }
};

exports.setupProject = async (req, res) => {
    const { id } = req.params;
    const { description, budget, start_date, end_date, selectedMembers } = req.body;

    try {
        await db.query(
            "UPDATE projects SET description = ?, budget = ?, start_date = ?, end_date = ?, status = 'On Track' WHERE project_id = ?",
            [description, budget, start_date, end_date, id]
        );

        if (selectedMembers && selectedMembers.length > 0) {
            const values = selectedMembers.map(userId => [id, userId]);
            await db.query("INSERT IGNORE INTO project_members (project_id, user_id) VALUES ?", [values]);

            // Notify each assigned member
            const [pNameRow] = await db.query("SELECT project_name FROM projects WHERE project_id = ?", [id]);
            const pName = pNameRow.length > 0 ? pNameRow[0].project_name : "Your Project";
            
            for (let memberId of selectedMembers) {
                await db.query("UPDATE users SET status = 'Active' WHERE id = ? AND resign_date IS NULL", [memberId]);
                await createAndSendNotification(
                    memberId,
                    "Project Assigned",
                    `You have been newly assigned to the project "${pName}".`,
                    "info",
                    pName
                );
            }
        }

        res.json({ message: "Project setup completed successfully" });

        // Trigger 7: Manpower Alert (Team Members < 3)
        const [pMembers] = await db.query("SELECT COUNT(*) as count FROM project_members WHERE project_id = ?", [id]);
        if (pMembers.length > 0 && pMembers[0].count < 3) {
            const [p] = await db.query("SELECT project_name, manager_id FROM projects WHERE project_id = ?", [id]);
            if (p.length > 0 && p[0].manager_id) {
                createAndSendNotification(
                    p[0].manager_id,
                    "Manpower Alert",
                    `Project "${p[0].project_name}" has fewer than 3 team members. Consider adding more resources.`,
                    'warning',
                    p[0].project_name
                );
            }
        }
    } catch (err) {
        console.error("SETUP PROJECT ERROR:", err);
        res.status(500).json({ message: "Error setting up project" });
    }
};

/* ================= MANAGER DASHBOARD ================= */
exports.getManagerDashboardData = async (req, res) => {
    const { managerId } = req.params;
    try {
        const [projects] = await db.query("SELECT * FROM projects WHERE manager_id = ?", [managerId]);

        let totalTasks = 0;
        let completedTasks = 0;
        let pendingTasks = 0;

        for (const project of projects) {
            const [tasks] = await db.query("SELECT status FROM tasks WHERE project_id = ?", [project.project_id]);
            totalTasks += tasks.length;
            completedTasks += tasks.filter(t => t.status === 'Completed').length;
            pendingTasks += tasks.filter(t => t.status !== 'Completed').length;
        }

        res.json({
            stats: {
                totalProjects: projects.length,
                totalTasks,
                completedTasks,
                pendingTasks
            },
            projects
        });
    } catch (err) {
        console.error("MANAGER DASHBOARD ERROR:", err);
        res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
};

/* ================= MEMBER DASHBOARD ================= */
exports.getMemberDashboardData = async (req, res) => {
    const { memberId } = req.params;
    try {
        // 1. Get stats
        const [statsRows] = await db.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'Completed' OR status = 'Reviewed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN status = 'Pending Review' THEN 1 ELSE 0 END) as pending_review
            FROM tasks 
            WHERE assigned_to = ?
        `, [memberId]);

        // 2. Get assigned tasks (with project names)
        const [tasks] = await db.query(`
            SELECT t.*, p.project_name 
            FROM tasks t
            JOIN projects p ON t.project_id = p.project_id
            WHERE t.assigned_to = ?
            ORDER BY t.due_date ASC
        `, [memberId]);

        // 3. Simple Activity (Mocked)
        const activities = [
            { id: 1, type: 'Completed task', detail: 'API Integration', timestamp: '2 hours ago' },
            { id: 2, type: 'Updated progress', detail: 'User Authentication', timestamp: '4 hours ago' },
            { id: 3, type: 'Submitted for review', detail: 'Unit Tests', timestamp: '1 day ago' }
        ];

        // 4. Performance Metrics (Demo Data)
        const completedCount = statsRows[0].completed || 0;
        const performance = {
            tasksCompleted: completedCount,
            targetTasks: 30,
            onTimeDelivery: 95,
            codeQuality: 4.8,
            collaboration: 4.5
        };

        res.json({
            stats: statsRows[0] || { total: 0, completed: 0, in_progress: 0, pending_review: 0 },
            tasks,
            activities,
            performance
        });
    } catch (err) {
        console.error("MEMBER DASHBOARD DATA ERROR:", err);
        res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
};

/* ================= MEMBER PROGRESS ================= */
exports.getMemberProgressData = async (req, res) => {
    const { memberId } = req.params;
    try {
        // Get projects where member has tasks assigned
        const [taskProjects] = await db.query(`
            SELECT DISTINCT p.project_id, p.project_name, p.status as project_status
            FROM projects p
            JOIN tasks t ON p.project_id = t.project_id
            WHERE t.assigned_to = ?
        `, [memberId]);

        // Also include projects from project_members table (if it exists)
        let membershipProjects = [];
        try {
            const [pm] = await db.query(`
                SELECT DISTINCT p.project_id, p.project_name, p.status as project_status
                FROM projects p
                JOIN project_members pm ON p.project_id = pm.project_id
                WHERE pm.user_id = ?
            `, [memberId]);
            const existingIds = new Set(taskProjects.map(p => p.project_id));
            membershipProjects = pm.filter(p => !existingIds.has(p.project_id));
        } catch (_) {
            // project_members table may not exist yet
        }

        const allProjects = [...taskProjects, ...membershipProjects];

        const projectData = [];

        for (const project of allProjects) {
            // Real overall project stats
            const [overall] = await db.query(`
                SELECT 
                    COUNT(*) as total_tasks,
                    IFNULL(ROUND(AVG(progress), 1), 0) as project_progress,
                    SUM(CASE WHEN status = 'Reviewed' OR status = 'Completed' THEN 1 ELSE 0 END) as reviewed_count,
                    SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress_count,
                    SUM(CASE WHEN status = 'Todo' THEN 1 ELSE 0 END) as todo_count
                FROM tasks 
                WHERE project_id = ?
            `, [project.project_id]);

            // Real member-specific stats
            const [memberStats] = await db.query(`
                SELECT 
                    COUNT(*) as member_tasks,
                    IFNULL(ROUND(AVG(progress), 1), 0) as member_progress,
                    SUM(CASE WHEN status = 'Reviewed' OR status = 'Completed' THEN 1 ELSE 0 END) as member_reviewed,
                    SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as member_in_progress
                FROM tasks 
                WHERE project_id = ? AND assigned_to = ?
            `, [project.project_id, memberId]);

            const actual = parseFloat(overall[0].project_progress) || 0;
            const memberActual = parseFloat(memberStats[0].member_progress) || 0;
            const totalTasks = parseInt(overall[0].total_tasks) || 0;
            const memberTaskCount = parseInt(memberStats[0].member_tasks) || 0;

            // Status based on real task data
            let status = 'On Track';
            if (actual < 30 && totalTasks > 0) status = 'At Risk';
            if (actual === 0 && totalTasks > 0) status = 'Behind Schedule';

            // Milestones based on real progress
            const milestones = [
                { name: 'Project Kickoff', date: project.start_date || '—', status: 'Completed', progress: 100 },
                { name: 'Planning & Requirements', date: '—', status: actual >= 10 ? 'Completed' : 'In Progress', progress: actual >= 10 ? 100 : actual * 5 },
                { name: 'Development Phase', date: '—', status: actual >= 60 ? 'Completed' : (actual > 10 ? 'In Progress' : 'Upcoming'), progress: Math.min(100, actual) },
                { name: 'Testing Phase', date: '—', status: actual >= 80 ? 'In Progress' : 'Upcoming', progress: actual >= 80 ? (actual - 80) * 5 : 0 },
                { name: 'Deployment', date: '—', status: actual === 100 ? 'Completed' : 'Upcoming', progress: actual === 100 ? 100 : 0 }
            ];

            projectData.push({
                project_id: project.project_id,
                project_name: project.project_name,
                actual_progress: actual,
                member_progress: memberActual,
                total_tasks: totalTasks,
                member_tasks: memberTaskCount,
                reviewed_tasks: parseInt(overall[0].reviewed_count) || 0,
                member_reviewed: parseInt(memberStats[0].member_reviewed) || 0,
                in_progress_count: parseInt(overall[0].in_progress_count) || 0,
                todo_count: parseInt(overall[0].todo_count) || 0,
                contribution_percent: totalTasks > 0 ? Math.round((memberTaskCount / totalTasks) * 100) : 0,
                status,
                milestones
            });
        }

        // Real aggregate summary
        const totalReviewed = projectData.reduce((sum, p) => sum + p.reviewed_tasks, 0);
        const totalTasks = projectData.reduce((sum, p) => sum + p.total_tasks, 0);
        const avgProgress = projectData.length > 0
            ? Math.round(projectData.reduce((sum, p) => sum + p.actual_progress, 0) / projectData.length)
            : 0;
        const memberTasksTotal = projectData.reduce((sum, p) => sum + p.member_tasks, 0);

        // Radar data based on real metrics
        const onTimeRate = totalTasks > 0 ? Math.round((totalReviewed / totalTasks) * 100) : 0;
        const radarData = [
            { subject: 'Quality', A: Math.min(100, onTimeRate + 20), fullMark: 100 },
            { subject: 'Speed', A: Math.max(40, avgProgress), fullMark: 100 },
            { subject: 'Collaboration', A: projectData.length > 1 ? 85 : 70, fullMark: 100 },
            { subject: 'Innovation', A: 75, fullMark: 100 },
            { subject: 'Documentation', A: Math.min(100, avgProgress + 10), fullMark: 100 }
        ];

        // Trend data derived from real task progress (spread over 6 weeks)
        const trendData = [1, 2, 3, 4, 5, 6].map(week => ({
            name: `Week ${week}`,
            planned: Math.min(100, week * Math.ceil(100 / 6)),
            actual: Math.min(avgProgress, Math.round(avgProgress * (week / 6) * (0.9 + Math.random() * 0.2)))
        }));
        // Set last week to match actual progress
        if (trendData.length > 0) trendData[5].actual = avgProgress;

        res.json({
            summary: {
                overallProgress: avgProgress,
                tasksCompleted: totalReviewed,
                totalTasks,
                memberTasks: memberTasksTotal,
                activeProjects: projectData.length,
                avgPerformance: totalTasks > 0 ? Math.round((totalReviewed / totalTasks) * 100) : 0
            },
            projects: projectData,
            radarData,
            trendData
        });
    } catch (err) {
        console.error("MEMBER PROGRESS DATA ERROR:", err);
        res.status(500).json({ message: "Failed to fetch progress data" });
    }
};



exports.updateTaskProgress = async (req, res) => {
    const { taskId } = req.params;
    const { progress, status } = req.body;
    try {
        await db.query(
            "UPDATE tasks SET progress = ?, status = ? WHERE task_id = ?",
            [progress, status, taskId]
        );
        res.json({ message: "Task updated successfully" });

        // Triggers 3, 10: Task Completed / Progress Updates (Notify PM)
        const [t] = await db.query("SELECT project_id, task_name, assigned_to FROM tasks WHERE task_id = ?", [taskId]);
        if (t.length > 0) {
            const { project_id, task_name, assigned_to } = t[0];
            const [p] = await db.query("SELECT project_name, manager_id FROM projects WHERE project_id = ?", [project_id]);
            
            if (p.length > 0 && p[0].manager_id) {
                const [u] = await db.query("SELECT name FROM users WHERE id = ?", [assigned_to]);
                const uName = u.length > 0 ? u[0].name : "A member";

                if (status === 'Completed' || status === 'Pending Review') {
                    // Trigger 3: Task Completed
                    createAndSendNotification(
                        p[0].manager_id,
                        "Task Completed",
                        `${uName} has completed the task: "${task_name}".`,
                        'success',
                        p[0].project_name
                    );
                } else if (progress > 0) {
                    // Trigger 10: Progress Update
                    createAndSendNotification(
                        p[0].manager_id,
                        "Progress Update",
                        `Task "${task_name}" progress updated to ${progress}% by ${uName}.`,
                        'info',
                        p[0].project_name
                    );
                }
            }
        }
    } catch (err) {
        console.error("UPDATE TASK PROGRESS ERROR:", err);
        res.status(500).json({ message: "Failed to update task" });
    }
};

/* ================= REVIEW TASK (PM) ================= */
exports.reviewTask = async (req, res) => {
    const { taskId } = req.params;
    try {
        await db.query(
            "UPDATE tasks SET status = 'Reviewed' WHERE task_id = ? AND status = 'Pending Review'",
            [taskId]
        );
        res.json({ message: "Task marked as reviewed" });
    } catch (err) {
        console.error("REVIEW TASK ERROR:", err);
        res.status(500).json({ message: "Failed to review task" });
    }
};

/* ================= MANAGER PROGRESS DATA ================= */
exports.getManagerProgressData = async (req, res) => {
    const { managerId } = req.params;
    try {
        // Get all projects managed by this manager
        const [projects] = await db.query(`
            SELECT project_id, project_name, status, start_date, end_date
            FROM projects WHERE manager_id = ?
        `, [managerId]);

        const projectData = [];
        let allPendingTasks = [];

        for (const project of projects) {
            // Overall task stats
            const [stats] = await db.query(`
                SELECT 
                    COUNT(*) as total_tasks,
                    IFNULL(ROUND(AVG(progress), 1), 0) as avg_progress,
                    SUM(CASE WHEN status = 'Completed' OR status = 'Reviewed' THEN 1 ELSE 0 END) as completed,
                    SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress,
                    SUM(CASE WHEN status = 'Pending Review' THEN 1 ELSE 0 END) as pending_review,
                    SUM(CASE WHEN status = 'Todo' THEN 1 ELSE 0 END) as todo
                FROM tasks WHERE project_id = ?
            `, [project.project_id]);

            // Member contributions
            const [members] = await db.query(`
                SELECT 
                    u.id as user_id, u.name as member_name,
                    COUNT(t.task_id) as task_count,
                    IFNULL(ROUND(AVG(t.progress), 1), 0) as avg_progress,
                    SUM(CASE WHEN t.status = 'Reviewed' OR t.status = 'Completed' THEN 1 ELSE 0 END) as reviewed
                FROM tasks t
                JOIN users u ON t.assigned_to = u.id
                WHERE t.project_id = ?
                GROUP BY u.id, u.name
            `, [project.project_id]);

            // Pending review tasks for this project
            const [pendingTasks] = await db.query(`
                SELECT t.task_id, t.task_name, t.progress, t.status, t.due_date,
                       u.name as assignee_name, p.project_name
                FROM tasks t
                JOIN users u ON t.assigned_to = u.id
                JOIN projects p ON t.project_id = p.project_id
                WHERE t.project_id = ? AND t.status = 'Pending Review'
            `, [project.project_id]);

            allPendingTasks = allPendingTasks.concat(pendingTasks);

            const s = stats[0];
            projectData.push({
                project_id: project.project_id,
                project_name: project.project_name,
                status: project.status,
                progress: parseFloat(s.avg_progress) || 0,
                total_tasks: parseInt(s.total_tasks) || 0,
                completed: parseInt(s.completed) || 0,
                in_progress: parseInt(s.in_progress) || 0,
                pending_review: parseInt(s.pending_review) || 0,
                todo: parseInt(s.todo) || 0,
                members
            });
        }

        // Summary
        const totalTasks = projectData.reduce((s, p) => s + p.total_tasks, 0);
        const totalCompleted = projectData.reduce((s, p) => s + p.completed, 0);
        const totalPending = projectData.reduce((s, p) => s + p.pending_review, 0);
        const avgProgress = projectData.length > 0
            ? Math.round(projectData.reduce((s, p) => s + p.progress, 0) / projectData.length)
            : 0;

        // Trend data derived from real averages
        const trendData = [1, 2, 3, 4, 5, 6].map(week => ({
            name: `Week ${week}`,
            planned: Math.min(100, week * Math.ceil(100 / 6)),
            actual: Math.min(avgProgress, Math.round(avgProgress * (week / 6)))
        }));
        if (trendData.length > 0) trendData[5].actual = avgProgress;

        res.json({
            summary: {
                totalProjects: projects.length,
                totalTasks,
                completedTasks: totalCompleted,
                pendingReview: totalPending,
                overallProgress: avgProgress
            },
            projects: projectData,
            pendingReviewTasks: allPendingTasks,
            trendData
        });
    } catch (err) {
        console.error("MANAGER PROGRESS DATA ERROR:", err);
        res.status(500).json({ message: "Failed to fetch manager progress data" });
    }
};

/* ================= RESOURCE USAGE & COST TRACKING ================= */
exports.logResourceUsage = async (req, res) => {
    const { taskId } = req.params;
    const { projectId, resourceId, quantity } = req.body;
    const userId = req.user?.id || null;

    try {
        console.log(`[DEBUG] Logging resource usage: Task ${taskId}, Project ${projectId}, Resource ${resourceId}, Qty ${quantity}`);

        const intTaskId = parseInt(taskId);
        const intProjectId = parseInt(projectId);
        const intResourceId = parseInt(resourceId);
        const intQuantity = parseInt(quantity) || 0;

        if (!intProjectId || !intResourceId) {
            return res.status(400).json({ message: "Invalid Project or Resource ID" });
        }

        const [resources] = await db.query("SELECT resource_type, cost_per_unit FROM resources WHERE resource_id = ?", [intResourceId]);
        if (resources.length === 0) return res.status(404).json({ message: "Resource not found in catalog" });

        const costPerUnit = parseFloat(resources[0].cost_per_unit) || 0;
        const totalCost = costPerUnit * intQuantity;
        const category = resources[0].resource_type || "Miscellaneous";

        await db.query(`
            INSERT INTO costs (project_id, resource_id, quantity, cost_per_unit, total_cost, usage_date, category, task_id, user_id)
            VALUES (?, ?, ?, ?, ?, CURDATE(), ?, ?, ?)
        `, [intProjectId, intResourceId, intQuantity, costPerUnit, totalCost, category, intTaskId, userId]);

        // --- NEW: Populate project_resource_allocations ---
        // Check if allocation already exists for this project/resource
        const [existing] = await db.query(
            "SELECT allocation_id, allocated_units FROM project_resource_allocations WHERE project_id = ? AND resource_id = ?",
            [intProjectId, intResourceId]
        );

        if (existing.length > 0) {
            await db.query(
                "UPDATE project_resource_allocations SET allocated_units = allocated_units + ? WHERE allocation_id = ?",
                [intQuantity, existing[0].allocation_id]
            );
        } else {
            await db.query(
                "INSERT INTO project_resource_allocations (project_id, resource_id, allocated_units) VALUES (?, ?, ?)",
                [intProjectId, intResourceId, intQuantity]
            );
        }

        res.json({ message: "Usage logged successfully", totalCost });

        // Triggers 5, 6, 9: Budget & Resource Conflict Detection
        const [projRows] = await db.query("SELECT budget, project_name, manager_id FROM projects WHERE project_id = ?", [intProjectId]);
        if (projRows.length > 0 && projRows[0].manager_id) {
            const { budget, project_name, manager_id } = projRows[0];
            const b = parseFloat(budget) || 0;

            if (b > 0) {
                // Re-calculate Total Spent
                const [totalRows] = await db.query("SELECT COALESCE(SUM(total_cost), 0) as total FROM costs WHERE project_id = ?", [intProjectId]);
                const totalSpent = parseFloat(totalRows[0].total);

                if (totalSpent > b) {
                    // Trigger 6: Exceeds 100%
                    createAndSendNotification(
                        manager_id,
                        "Budget Exceeded",
                        `Project budget of $${b} has been exceeded! Total cost is $${totalSpent}.`,
                        'critical',
                        project_name
                    );
                } else if (totalSpent >= b * 0.90) {
                    // Trigger 5: Reaches 90%
                    createAndSendNotification(
                        manager_id,
                        "Budget Warning",
                        `Project budget is at 90% or more. Total spent: $${totalSpent} out of $${b}.`,
                        'warning',
                        project_name
                    );
                }
            }

            // Pseudo logical check for resource conflict (Trigger 9)
            if (intQuantity > 50) { // Arbitrary heuristic threshold
                createAndSendNotification(
                    manager_id,
                    "Resource Conflict",
                    `High volume of resources (${intQuantity} units) requested by Task ${intTaskId}. Potential constraint.`,
                    'critical',
                    project_name
                );
            }
        }
    } catch (err) {
        console.error("LOG RESOURCE USAGE ERROR:", err);
        res.status(500).json({ message: "Failed to log resource usage", details: err.message });
    }
};

exports.getProjectCostTracking = async (req, res) => {
    const { projectId } = req.params;

    try {
        // Get total budget from projects table
        const [projRows] = await db.query("SELECT budget FROM projects WHERE project_id = ?", [projectId]);
        const totalBudget = parseFloat(projRows[0]?.budget) || 0;

        // Total spent
        const [totalRows] = await db.query("SELECT COALESCE(SUM(total_cost), 0) as total FROM costs WHERE project_id = ?", [projectId]);
        const totalSpent = parseFloat(totalRows[0].total);

        // Cost grouped by resource
        const [byResource] = await db.query(`
            SELECT r.resource_name as label, COALESCE(SUM(c.total_cost), 0) as value
            FROM costs c
            LEFT JOIN resources r ON c.resource_id = r.resource_id
            WHERE c.project_id = ?
            GROUP BY r.resource_name
            ORDER BY value DESC
        `, [projectId]);

        // Cost grouped by team member
        const [byMember] = await db.query(`
            SELECT u.name as label, COALESCE(SUM(c.total_cost), 0) as value
            FROM costs c
            LEFT JOIN users u ON c.user_id = u.id
            WHERE c.project_id = ?
            GROUP BY u.name
            ORDER BY value DESC
        `, [projectId]);

        // Cost grouped by task
        const [byTask] = await db.query(`
            SELECT t.task_name as label, COALESCE(SUM(c.total_cost), 0) as value
            FROM costs c
            LEFT JOIN tasks t ON c.task_id = t.task_id
            WHERE c.project_id = ?
            GROUP BY t.task_name
            ORDER BY value DESC
        `, [projectId]);

        // Monthly actual spending
        const [monthly] = await db.query(`
            SELECT DATE_FORMAT(usage_date, '%b') as monthStr, MONTH(usage_date) as monthNum, SUM(total_cost) as total
            FROM costs
            WHERE project_id = ?
            GROUP BY monthStr, monthNum
            ORDER BY monthNum
        `, [projectId]);

        // Raw cost log for the table
        const [rawCosts] = await db.query(`
            SELECT c.*, r.resource_name, u.name as member_name, t.task_name
            FROM costs c
            LEFT JOIN resources r ON c.resource_id = r.resource_id
            LEFT JOIN users u ON c.user_id = u.id
            LEFT JOIN tasks t ON c.task_id = t.task_id
            WHERE c.project_id = ?
            ORDER BY c.created_at DESC
        `, [projectId]);

        res.json({
            totals: {
                budgeted: totalBudget,
                spent: totalSpent,
                remaining: totalBudget - totalSpent,
                variance: totalBudget - totalSpent
            },
            byResource,
            byMember,
            byTask,
            monthlyCosts: monthly,
            rawCosts
        });
    } catch (err) {
        console.error("GET PROJECT COST TRACKING ERROR:", err);
        res.status(500).json({ message: "Failed to fetch project cost tracking data" });
    }
};