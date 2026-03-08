require('dotenv').config({ path: './backend/.env' });
const db = require('./backend/config/db');

async function seed() {
    try {
        const [projects] = await db.query("SELECT project_id FROM projects LIMIT 1");
        const [members] = await db.query("SELECT id FROM users WHERE role = 'member' LIMIT 1");

        if (projects.length === 0 || members.length === 0) {
            console.log("Not enough data to seed tasks. Create a project and member first.");
            process.exit(0);
        }

        const pId = projects[0].project_id;
        const uId = members[0].id;

        console.log(`Seeding tasks for Project ${pId} and Member ${uId}...`);

        const tasks = [
            [pId, 'Design Homepage UI', 'Complete redesign of company website with modern UI/UX', uId, 'High', '2026-03-20', 'In Progress', 40, JSON.stringify(['Figma', 'Design System'])],
            [pId, 'Implement Authentication', 'Firebase or JWT based auth', uId, 'High', '2026-03-25', 'In Progress', 60, JSON.stringify(['Backend Server', 'Database'])],
            [pId, 'Setup CI/CD Pipeline', 'GitHub Actions or Jenkins', uId, 'Medium', '2026-04-01', 'Pending', 30, JSON.stringify(['DevOps Tools', 'Cloud Server'])]
        ];

        for (const task of tasks) {
            await db.query("INSERT INTO tasks (project_id, task_name, description, assigned_to, priority, due_date, status, estimated_hours, resources) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", task);
        }

        console.log("Seeding complete.");
        process.exit(0);
    } catch (err) {
        console.error("Seeding error:", err);
        process.exit(1);
    }
}

seed();
