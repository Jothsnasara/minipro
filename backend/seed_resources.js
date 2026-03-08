require('dotenv').config({ path: './.env' });
const db = require('./config/db');

const seedResources = async () => {
    const resources = [
        ['Figma', 'Design'],
        ['Design System', 'Design'],
        ['Backend Server', 'Infrastructure'],
        ['Database', 'Infrastructure'],
        ['DevOps Tools', 'Infrastructure'],
        ['Cloud Server', 'Infrastructure'],
        ['Documentation Tools', 'Management']
    ];

    try {
        // Clear existing resources to avoid duplicates during seeding
        await db.query("DELETE FROM resources");
        
        const sql = "INSERT INTO resources (resource_name, resource_type) VALUES ?";
        await db.query(sql, [resources]);
        
        console.log("Resources seeded successfully!");
        process.exit(0);
    } catch (err) {
        console.error("Error seeding resources:", err);
        process.exit(1);
    }
};

seedResources();
