const db = require("../config/db");

/* ================= GET ALL PROJECTS ================= */
exports.getAllProjects = async (req, res) => {
    const sql = `
    SELECT 
      p.*,
      u.name as manager_name
    FROM projects p
    LEFT JOIN users u ON p.manager_id = u.id
    ORDER BY p.start_date DESC
  `;

    try {
        const [results] = await db.query(sql);
        res.json(results);
    } catch (err) {
        console.error("GET PROJECTS ERROR 👉", err);
        res.status(500).json({ message: "Failed to fetch projects" });
    }
};

/* ================= GET MANAGER PROJECTS ================= */
exports.getManagerProjects = async (req, res) => {
    const { managerId } = req.params;
    console.log(`[DEBUG] Fetching projects for manager ID: ${managerId}`);

    if (!managerId) {
        return res.status(400).json({ message: "Manager ID is required" });
    }

    const sql = `
    SELECT 
      p.*,
      u.name as manager_name
    FROM projects p
    LEFT JOIN users u ON p.manager_id = u.id
    WHERE p.manager_id = ?
    ORDER BY p.end_date ASC
  `;

    try {
        const [results] = await db.query(sql, [managerId]);
        console.log(`[DEBUG] Found ${results.length} projects for manager ${managerId}`);
        res.json(results);
    } catch (err) {
        console.error("GET MANAGER PROJECTS ERROR 👉", err);
        res.status(500).json({ message: "Failed to fetch manager projects" });
    }
};

/* ================= CREATE PROJECT ================= */
exports.createProject = async (req, res) => {
    const {
        project_name,
        manager_id,
        description,
        budget,
        start_date,
        end_date,
        status
    } = req.body;

    if (!project_name) {
        return res.status(400).json({ message: "Project name is required" });
    }
    if (!manager_id) {
        return res.status(400).json({ message: "Manager assignment is required" });
    }

    const sql = `
    INSERT INTO projects 
    (project_name, description, budget, start_date, end_date, manager_id, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

    const statusValue = status || 'Planning';
    const descriptionValue = description || '';
    const budgetValue = budget || 0;
    const startDateValue = start_date || null;
    const endDateValue = end_date || null;

    try {
        const [result] = await db.query(
            sql,
            [project_name, descriptionValue, budgetValue, startDateValue, endDateValue, manager_id, statusValue]
        );

        // 3. Update Manager Status to 'Active'
        const updateManagerSql = "UPDATE users SET status = 'Active' WHERE id = ?";
        try {
            await db.query(updateManagerSql, [manager_id]);
        } catch (updateErr) {
            console.error("FAILED TO ACTIVATE MANAGER 👉", updateErr);
        }

        res.status(201).json({ message: "Project assigned successfully", projectId: result.insertId });
    } catch (err) {
        console.error("CREATE PROJECT ERROR 👉", err);
        res.status(500).json({ message: "Failed to assign project: " + err.message });
    }
};

/* ================= GET MANAGER TEAM MEMBERS (KPI) ================= */
exports.getManagerTeamMembers = async (req, res) => {
    const { managerId } = req.params;

    if (!managerId) {
        return res.status(400).json({ message: "Manager ID is required" });
    }

    const sql = `
        SELECT COUNT(DISTINCT t.assigned_to) as team_count
        FROM tasks t
        JOIN projects p ON t.project_id = p.project_id
        WHERE p.manager_id = ?
    `;

    try {
        const [results] = await db.query(sql, [managerId]);
        res.json({ team_count: results[0].team_count });
    } catch (err) {
        console.error("GET TEAM MEMBERS ERROR 👉", err);
        res.status(500).json({ message: "Failed to fetch team members count" });
    }
};

/* ================= GET UNFILLED PROJECTS (Status = Planning) ================= */
exports.getUnfilledProjects = async (req, res) => {
    const { managerId } = req.params;
    if (!managerId) return res.status(400).json({ message: "Manager ID required" });

    const sql = "SELECT id as project_id, project_name FROM projects WHERE manager_id = ? AND (status = 'Planning' OR status = 'planning')";

    try {
        const [results] = await db.query(sql, [managerId]);
        res.json(results);
    } catch (err) {
        console.error("GET UNFILLED ERROR", err);
        res.status(500).json({ message: "Failed to fetch unfilled projects" });
    }
};

/* ================= COMPLETE PROJECT DETAILS (Status -> Active) ================= */
exports.completeProject = async (req, res) => {
    const { id } = req.params;
    const { description, budget, start_date, end_date } = req.body;

    const sql = `
        UPDATE projects 
        SET description = ?, budget = ?, start_date = ?, end_date = ?, status = 'Active'
        WHERE id = ?
    `;

    try {
        const [result] = await db.query(sql, [description, budget, start_date, end_date, id]);
        res.json({ message: "Project updated to Active" });
    } catch (err) {
        console.error("COMPLETE PROJECT ERROR", err);
        res.status(500).json({ message: "Failed to update project" });
    }
};

/* ================= CREATE TASK ================= */
exports.createTask = async (req, res) => {
    const { project_id, task_name, description, memberId, priority, due_date, resources } = req.body;

    if (!project_id || !task_name || !memberId || !due_date) {
        return res.status(400).json({ message: "All fields are required" });
    }

    const sql = `
        INSERT INTO tasks (project_id, task_name, description, assigned_to, priority, due_date, status, resources)
        VALUES (?, ?, ?, ?, ?, ?, 'Pending', ?)
    `;

    try {
        const [result] = await db.query(sql, [
            project_id,
            task_name,
            description || '',
            memberId,
            priority || 'Medium',
            due_date,
            JSON.stringify(resources || [])
        ]);

        // Update User Status to 'Active' when assigned a task
        const updateUserSql = "UPDATE users SET status = 'Active' WHERE id = ?";
        await db.query(updateUserSql, [memberId]);

        res.status(201).json({ message: "Task assigned successfully", taskId: result.insertId });
    } catch (err) {
        if (err.code === '45000' || (err.sqlState === '45000')) {
            return res.status(400).json({ message: err.message });
        }
        console.error("CREATE TASK ERROR 👉", err);
        res.status(500).json({ message: "Failed to create task: " + err.message });
    }
};
/* ================= ASSIGN MEMBER TO PROJECT ================= */
exports.assignMemberToProject = async (req, res) => {
    const { projectId } = req.params;
    const { userId } = req.body;

    if (!projectId || !userId) {
        return res.status(400).json({ message: "Project ID and User ID are required" });
    }

    const sql = "INSERT INTO project_members (project_id, user_id) VALUES (?, ?)";

    try {
        await db.query(sql, [projectId, userId]);
        res.status(201).json({ message: "Member assigned to project successfully" });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: "Member already assigned to this project" });
        }
        console.error("ASSIGN MEMBER ERROR 👉", err);
        res.status(500).json({ message: "Failed to assign member: " + err.message });
    }
};

/* ================= GET PROJECT MEMBERS ================= */
exports.getProjectMembers = async (req, res) => {
    const { projectId } = req.params;

    if (!projectId) {
        return res.status(400).json({ message: "Project ID is required" });
    }

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
        console.error("GET PROJECT MEMBERS ERROR 👉", err);
        res.status(500).json({ message: "Failed to fetch project members" });
    }
};
