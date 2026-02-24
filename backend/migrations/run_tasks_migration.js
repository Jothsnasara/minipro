require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrate() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        multipleStatements: true
    });

    console.log('Connected to MySQL');

    // Check existing columns
    const [cols] = await conn.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'tasks'`,
        [process.env.DB_NAME]
    );
    const existingCols = cols.map(c => c.COLUMN_NAME);
    console.log('Existing columns:', existingCols);

    if (!existingCols.includes('estimated_hours')) {
        await conn.query(`ALTER TABLE tasks ADD COLUMN estimated_hours DECIMAL(6,2) DEFAULT 0`);
        console.log('✅ Added estimated_hours column');
    } else {
        console.log('⏭ estimated_hours already exists');
    }

    if (!existingCols.includes('resources')) {
        await conn.query(`ALTER TABLE tasks ADD COLUMN resources TEXT`);
        console.log('✅ Added resources column');
    } else {
        console.log('⏭ resources already exists');
    }

    // Drop and recreate triggers
    await conn.query(`DROP TRIGGER IF EXISTS restrict_task_on_completed_project`);
    await conn.query(`DROP TRIGGER IF EXISTS restrict_task_update_on_completed_project`);

    await conn.query(`
    CREATE TRIGGER restrict_task_on_completed_project
    BEFORE INSERT ON tasks
    FOR EACH ROW
    BEGIN
      DECLARE project_status VARCHAR(50);
      SELECT status INTO project_status FROM projects WHERE project_id = NEW.project_id;
      IF project_status = 'Completed' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot add tasks to a completed project.';
      END IF;
    END
  `);
    console.log('✅ Created INSERT trigger');

    await conn.query(`
    CREATE TRIGGER restrict_task_update_on_completed_project
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    BEGIN
      DECLARE project_status VARCHAR(50);
      SELECT status INTO project_status FROM projects WHERE project_id = OLD.project_id;
      IF project_status = 'Completed' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot modify tasks of a completed project.';
      END IF;
    END
  `);
    console.log('✅ Created UPDATE trigger');

    // Verify final structure
    const [finalCols] = await conn.query(`DESCRIBE tasks`);
    console.log('\n📋 Final tasks table structure:');
    finalCols.forEach(c => console.log(`  ${c.Field} (${c.Type})`));

    await conn.end();
    console.log('\n✅ Migration complete!');
}

migrate().catch(err => {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
});
