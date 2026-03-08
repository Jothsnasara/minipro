const db = require("../config/db"); // IMPORTED ONLY ONCE AT THE TOP

/* ================= GET ALL PROJECTS ================= */
exports.getAllProjects = async (req, res) => {
    const sql = `
    SELECT p.*, u.name as manager_name
    FROM projects p
    LEFT JOIN users u ON p.manager_id = u.id
    ORDER BY p.start_date DESC
  `;
    try {
        const [results] = await db.query(sql);
        res.json(results);
    } catch (err) {
        console.error("GET PROJECTS ERROR:", err);
        res.status(500).json({ message: "Failed to fetch projects" });
    }
};

/* ================= GET MANAGER PROJECTS (With Member Count) ================= */
exports.getManagerProjects = async (req, res) => {
    const { managerId } = req.params;
    if (!managerId) return res.status(400).json({ message: "Manager ID is required" });

    // This query includes the subquery for member_count AND the manager name
    const sql = `
        SELECT p.*, u.name as manager_name, 
        (SELECT COUNT(*) FROM project_members pm WHERE pm.project_id = p.project_id) as member_count
        FROM projects p
        LEFT JOIN users u ON p.manager_id = u.id
        WHERE p.manager_id = ?
        ORDER BY p.end_date ASC
    `;
    try {
        const [results] = await db.query(sql, [managerId]);
        res.json(results);
    } catch (err) {
        console.error("GET MANAGER PROJECTS ERROR:", err);
        res.status(500).json({ message: "Failed to fetch manager projects" });
    }
};

/* ================= ADD SINGLE MEMBER TO TEAM ================= */
exports.addProjectMember = async (req, res) => {
    const { projectId } = req.params;
    const { userId } = req.body;

    if (!projectId || !userId) return res.status(400).json({ message: "Missing data" });

    try {
        const [existing] = await db.query("SELECT * FROM project_members WHERE project_id = ? AND user_id = ?", [projectId, userId]);
        if (existing.length > 0) return res.status(400).json({ message: "Member already in team" });

        await db.query("INSERT INTO project_members (project_id, user_id) VALUES (?, ?)", [projectId, userId]);
        res.json({ message: "Member added successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/* ================= CREATE PROJECT (Initial Assignment) ================= */
exports.createProject = async (req, res) => {
    const { project_name, manager_id, description, budget, start_date, end_date, status } = req.body;

    if (!project_name || !manager_id) {
        return res.status(400).json({ message: "Project name and Manager are required" });
    }

    const sql = `INSERT INTO projects (project_name, description, budget, start_date, end_date, manager_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)`;

    try {
        const [result] = await db.query(sql, [
            project_name, 
            description || '', 
            budget || 0, 
            start_date || null, 
            end_date || null, 
            manager_id, 
            status || 'Planning'
        ]);

        await db.query("UPDATE users SET status = 'Active' WHERE id = ?", [manager_id]);
        res.status(201).json({ message: "Project assigned successfully", projectId: result.insertId });
    } catch (err) {
        res.status(500).json({ message: "Failed to assign project: " + err.message });
    }
};

/* ================= COMPLETE PROJECT & ASSIGN MEMBERS ================= */
exports.completeProject = async (req, res) => {
    const projectId = req.params.id;
    const { description, budget, start_date, end_date, selectedMembers } = req.body;

    try {
        const sqlUpdateProject = `
            UPDATE projects 
            SET description = ?, budget = ?, start_date = ?, end_date = ?, status = 'Active' 
            WHERE project_id = ?
        `;
        const [result] = await db.query(sqlUpdateProject, [description, budget, start_date, end_date, projectId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Project not found." });
        }

        if (selectedMembers && selectedMembers.length > 0) {
            await db.query("DELETE FROM project_members WHERE project_id = ?", [projectId]);
            const memberData = selectedMembers.map(userId => [parseInt(projectId), parseInt(userId)]);
            const sqlInsertMembers = "INSERT INTO project_members (project_id, user_id) VALUES ?";
            await db.query(sqlInsertMembers, [memberData]);
        }

        res.json({ message: "Project activated and team members assigned successfully!" });
    } catch (err) {
        console.error("COMPLETE PROJECT ERROR:", err);
        res.status(500).json({ error: "Database error: " + err.message });
    }
};

/* ================= KPI: GET TEAM MEMBERS COUNT ================= */
exports.getManagerTeamMembersCount = async (req, res) => {
    const { managerId } = req.params;
    const sql = "SELECT COUNT(DISTINCT pm.user_id) AS team_count FROM project_members pm JOIN projects p ON pm.project_id = p.project_id WHERE p.manager_id = ?";
    try {
        const [rows] = await db.query(sql, [managerId]);
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/* ================= GET UNFILLED PROJECTS ================= */
exports.getUnfilledProjects = async (req, res) => {
    const { managerId } = req.params;
    const sql = "SELECT project_id, project_name FROM projects WHERE manager_id = ? AND status = 'Planning'";
    try {
        const [results] = await db.query(sql, [managerId]);
        res.json(results);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch unfilled projects" });
    }
};

/* ================= CREATE TASK ================= */
exports.createTask = async (req, res) => {
    const { project_id, task_name, description, memberId, priority, due_date, estimated_hours, resources } = req.body;
    const sql = `INSERT INTO tasks (project_id, task_name, description, assigned_to, priority, due_date, status, estimated_hours, resources) VALUES (?, ?, ?, ?, ?, ?, 'Pending', ?, ?)`;
    try {
        const [result] = await db.query(sql, [project_id, task_name, description || '', memberId, priority || 'Medium', due_date, estimated_hours || 0, JSON.stringify(resources || [])]);
        await db.query("UPDATE users SET status = 'Active' WHERE id = ?", [memberId]);
        res.status(201).json({ message: "Task assigned successfully", taskId: result.insertId });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/* ================= GET PROJECT TASKS ================= */
exports.getProjectTasks = async (req, res) => {
    const { projectId } = req.params;
    const sql = `
        SELECT t.*, u.name as assignee_name 
        FROM tasks t
        LEFT JOIN users u ON t.assigned_to = u.id
        WHERE t.project_id = ?
        ORDER BY t.due_date ASC
    `;
    try {
        const [results] = await db.query(sql, [projectId]);
        res.json(results);
    } catch (err) {
        console.error("GET PROJECT TASKS ERROR:", err);
        res.status(500).json({ message: "Failed to fetch project tasks" });
    }
};

/* ================= PROJECT MEMBERS HELPERS ================= */
exports.getProjectMembers = async (req, res) => {
    const { projectId } = req.params;
    const sql = `
        SELECT u.id, u.name, u.specialization, u.status 
        FROM users u
        JOIN project_members pm ON u.id = pm.user_id
        WHERE pm.project_id = ?
    `;
    try {
        const [results] = await db.query(sql, [projectId]);
        res.json(results);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch members" });
    }
};

/* ================= TEAM MEMBERS ================= */
exports.getAllTeamMembers = async (req, res) => {
    const sql = "SELECT id, name, specialization FROM users WHERE role = 'member' ORDER BY name ASC";
    try {
        const [results] = await db.query(sql);
        console.log(`[TEAM MEMBERS] Fetched ${results.length} members from database`);
        res.json(results);
    } catch (err) {
        console.error("GET TEAM MEMBERS ERROR:", err);
        res.status(500).json({ message: "Failed to fetch team members" });
    }
};

/* ================= RESOURCES ================= */
exports.getAllResources = async (req, res) => {
    const sql = "SELECT * FROM resources ORDER BY resource_name ASC";
    try {
        const [results] = await db.query(sql);
        console.log(`[RESOURCES] Fetched ${results.length} resources from database`);
        res.json(results);
    } catch (err) {
        console.error("GET RESOURCES ERROR:", err);
        res.status(500).json({ message: "Failed to fetch resources" });
    }
};