const mysql = require('mysql2/promise');
require('dotenv').config();

async function verify() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    console.log("--- SEEDING SPECIALIZATION ---");
    const [members] = await connection.query("SELECT id FROM users WHERE role = 'member' LIMIT 1");
    if (members.length > 0) {
        await connection.query("UPDATE users SET specialization = 'Frontend Expert' WHERE id = ?", [members[0].id]);
        console.log(`Updated user ${members[0].id} with specialization 'Frontend Expert'`);
    }

    console.log("\n--- TESTING TRIGGER (INSERT ON COMPLETED PROJECT) ---");
    // Find or create a completed project
    const [completedProjects] = await connection.query("SELECT project_id FROM projects WHERE status = 'Completed' LIMIT 1");
    let projectId;
    if (completedProjects.length > 0) {
        projectId = completedProjects[0].project_id;
    } else {
        const [anyProject] = await connection.query("SELECT project_id FROM projects LIMIT 1");
        if (anyProject.length > 0) {
            projectId = anyProject[0].project_id;
            await connection.query("UPDATE projects SET status = 'Completed' WHERE project_id = ?", [projectId]);
            console.log(`Set project ${projectId} to 'Completed' for testing.`);
        }
    }

    if (projectId) {
        try {
            await connection.query(
                "INSERT INTO tasks (project_id, task_name, assigned_to, due_date) VALUES (?, 'Illegal Task', ?, CURDATE())",
                [projectId, members[0].id]
            );
            console.error("FAIL: Trigger did not block insertion on completed project.");
        } catch (err) {
            console.log("SUCCESS: Trigger blocked insertion. Error:", err.message);
        }
    }

    await connection.end();
}

verify().catch(console.error);
