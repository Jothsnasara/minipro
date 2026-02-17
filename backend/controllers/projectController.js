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
        manager_id,
        // Optional fields that might still be sent or need defaults
        description,
        budget,
        start_date,
        end_date,
        status
    } = req.body;

    // 1. Validate required fields for "Assign Project"
    if (!project_name) {
        return res.status(400).json({ message: "Project name is required" });
    }
    if (!manager_id) {
        return res.status(400).json({ message: "Manager assignment is required" });
    }

    // 2. Prepare values with defaults
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

    db.query(
        sql,
        [project_name, descriptionValue, budgetValue, startDateValue, endDateValue, manager_id, statusValue],
        (err, result) => {
            if (err) {
                console.error("CREATE PROJECT ERROR 👉", err);
                return res.status(500).json({ message: "Failed to assign project: " + err.message });
            }

            // 3. Update Manager Status to 'Active'
            const updateManagerSql = "UPDATE users SET status = 'Active' WHERE id = ?";
            db.query(updateManagerSql, [manager_id], (updateErr) => {
                if (updateErr) {
                    console.error("FAILED TO ACTIVATE MANAGER 👉", updateErr);
                    // Log error but don't fail the request since project was created
                }
            });

            res.status(201).json({ message: "Project assigned successfully", projectId: result.insertId });
        }
    );
};
