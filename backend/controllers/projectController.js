const db = require("../config/db");

/* ================= GET ALL PROJECTS ================= */
exports.getAllProjects = (req, res) => {
    const sql = `
    SELECT 
      p.*,
      u.name as manager_name
    FROM projects p
    LEFT JOIN users u ON p.manager_id = u.id
    ORDER BY p.start_date DESC
  `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("GET PROJECTS ERROR 👉", err);
            return res.status(500).json({ message: "Failed to fetch projects" });
        }
        res.json(results);
    });
};

/* ================= CREATE PROJECT ================= */
exports.createProject = (req, res) => {
    const {
        project_name,
        description,
        budget,
        start_date,
        end_date,
        manager_id,
        status
    } = req.body;

    if (!project_name) {
        return res.status(400).json({ message: "Project name is required" });
    }

    const sql = `
    INSERT INTO projects 
    (project_name, description, budget, start_date, end_date, manager_id, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

    db.query(
        sql,
        [project_name, description, budget, start_date, end_date, manager_id, status || 'Planning'],
        (err, result) => {
            if (err) {
                console.error("CREATE PROJECT ERROR 👉", err);
                return res.status(500).json({ message: "Failed to create project: " + err.message });
            }

            // If a manager is assigned, update their status to 'Active'
            if (manager_id) {
                const updateManagerSql = "UPDATE users SET status = 'Active' WHERE id = ?";
                db.query(updateManagerSql, [manager_id], (updateErr) => {
                    if (updateErr) {
                        console.error("FAILED TO ACTIVATE MANAGER 👉", updateErr);
                        // We don't fail the project creation, just log the error
                    }
                });
            }

            res.status(201).json({ message: "Project created successfully", projectId: result.insertId });
        }
    );
};
