const db = require('./config/db');
const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, 'fix_log.txt');
function log(msg) {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] ${msg}\n`;
    console.log(msg);
    fs.appendFileSync(logFile, line);
}

const query = (sql, params) => new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
        if (err) reject(err);
        else resolve(results);
    });
});

async function fixSchema() {
    if (fs.existsSync(logFile)) fs.unlinkSync(logFile);
    log("Starting schema fix...");

    try {
        log("Checking tasks table columns...");
        const cols = await query("SHOW COLUMNS FROM tasks");
        const colNames = cols.map(c => c.Field);
        log(`Current columns: ${colNames.join(", ")}`);

        if (!colNames.includes('estimated_hours')) {
            log("Adding 'estimated_hours'...");
            await query("ALTER TABLE tasks ADD COLUMN estimated_hours DECIMAL(6,2) DEFAULT 0");
            log("✅ Added 'estimated_hours'");
        } else {
            log("⏭ 'estimated_hours' already exists");
        }

        if (!colNames.includes('resources')) {
            log("Adding 'resources'...");
            await query("ALTER TABLE tasks ADD COLUMN resources TEXT");
            log("✅ Added 'resources'");
        } else {
            log("⏭ 'resources' already exists");
        }

        if (!colNames.includes('progress')) {
            log("Adding 'progress'...");
            await query("ALTER TABLE tasks ADD COLUMN progress INT DEFAULT 0");
            log("✅ Added 'progress'");
        } else {
            log("⏭ 'progress' already exists");
        }

        log("🎉 Schema fix successful!");
        process.exit(0);
    } catch (error) {
        log(`❌ ERROR: ${error.message}`);
        console.error(error);
        process.exit(1);
    }
}

fixSchema();
