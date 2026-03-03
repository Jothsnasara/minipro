const db = require('./config/db');

const query = (sql, params) => new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
        if (err) reject(err);
        else resolve(results);
    });
});

async function fixSchema() {
    try {
        console.log("Checking and fixing tasks table schema...");

        // Check columns
        const cols = await query("SHOW COLUMNS FROM tasks");
        const colNames = cols.map(c => c.Field);
        console.log("Current columns:", colNames.join(", "));

        if (!colNames.includes('estimated_hours')) {
            console.log("Adding 'estimated_hours' column...");
            await query("ALTER TABLE tasks ADD COLUMN estimated_hours DECIMAL(6,2) DEFAULT 0");
            console.log("✅ Added 'estimated_hours'");
        }

        if (!colNames.includes('resources')) {
            console.log("Adding 'resources' column...");
            await query("ALTER TABLE tasks ADD COLUMN resources TEXT");
            console.log("✅ Added 'resources'");
        }

        if (!colNames.includes('progress')) {
            console.log("Adding 'progress' column...");
            await query("ALTER TABLE tasks ADD COLUMN progress INT DEFAULT 0");
            console.log("✅ Added 'progress'");
        }

        console.log("Schema fix completed successfully.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Schema fix failed:", error);
        process.exit(1);
    }
}

fixSchema();
