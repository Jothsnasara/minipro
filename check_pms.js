require('dotenv').config({ path: './backend/.env' });
const db = require('./backend/config/db');

async function checkPMs() {
    try {
        const [users] = await db.query("SELECT id, username, name, status, role FROM users WHERE role = 'manager'");
        const [projects] = await db.query("SELECT project_id, project_name, manager_id FROM projects");

        console.log("MANAGERS:");
        console.table(users);

        console.log("PROJECTS WITH MANAGERS:");
        console.table(projects.map(p => ({
            id: p.project_id,
            name: p.project_name,
            manager: users.find(u => u.id === p.manager_id)?.username || 'Unassigned'
        })));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkPMs();
