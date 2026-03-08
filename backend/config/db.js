const mysql = require("mysql2");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

pool.getConnection((err, connection) => {
  if (err) {
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.error('Database connection was closed.');
    }
    if (err.code === 'ER_CON_COUNT_ERROR') {
      console.error('Database has too many connections.');
    }
    if (err.code === 'ECONNREFUSED') {
      console.error('Database connection was refused.');
    }
  }
  if (connection) connection.release();
  return;
});

const dbPromise = pool.promise();

// Self-healing: Ensure schema is up to date
async function ensureSchema() {
  try {
    const [columns] = await dbPromise.query("SHOW COLUMNS FROM tasks");
    const fields = columns.map(col => col.Field);

    // Add description if missing
    if (!fields.includes('description')) {
      console.log("[DB-FIX] Adding 'description' column...");
      await dbPromise.query("ALTER TABLE tasks ADD COLUMN description TEXT AFTER task_name");
    }

    // Add estimated_hours if missing
    if (!fields.includes('estimated_hours')) {
      console.log("[DB-FIX] Adding 'estimated_hours' column...");
      await dbPromise.query("ALTER TABLE tasks ADD COLUMN estimated_hours INT DEFAULT 0");
    }

    // Add resources if missing
    if (!fields.includes('resources')) {
      console.log("[DB-FIX] Adding 'resources' column...");
      await dbPromise.query("ALTER TABLE tasks ADD COLUMN resources JSON");
    }

    // Add progress if missing
    if (!fields.includes('progress')) {
      console.log("[DB-FIX] Adding 'progress' column...");
      await dbPromise.query("ALTER TABLE tasks ADD COLUMN progress INT DEFAULT 0");
    }

    // Ensure status enum contains 'Pending Review' and 'Reviewed'
    const statusCol = columns.find(col => col.Field === 'status');
    if (statusCol && (!statusCol.Type.includes("'Pending Review'") || !statusCol.Type.includes("'Reviewed'"))) {
      console.log("[DB-FIX] Updating 'status' enum to include 'Pending Review' and 'Reviewed'...");
      await dbPromise.query("ALTER TABLE tasks MODIFY COLUMN status ENUM('Todo', 'In Progress', 'Completed', 'Pending', 'Pending Review', 'Reviewed') DEFAULT 'Todo'");
    }

    console.log("[DB-FIX] Schema check complete.");

    // Ensure project_members table exists
    await dbPromise.query(`
      CREATE TABLE IF NOT EXISTS project_members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        user_id INT NOT NULL,
        role VARCHAR(50) DEFAULT 'Member',
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY project_user (project_id, user_id),
        FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log("[DB-FIX] project_members table ensured.");

    // Healing: Populate project_members from existing tasks
    await dbPromise.query(`
      INSERT IGNORE INTO project_members (project_id, user_id)
      SELECT DISTINCT project_id, assigned_to FROM tasks WHERE assigned_to IS NOT NULL
    `);
    console.log("[DB-FIX] project_members membership healed.");
  } catch (err) {
    console.error("[DB-FIX] Schema synchronization failed:", err.message);
  }
}

// Run schema check
ensureSchema();

module.exports = dbPromise;
