const db = require('./config/db');

function query(sql, params) {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
}

async function reproduce() {
    try {
        console.log("Searching for task 'UI'...");
        const tasks = await query("SELECT task_id, assigned_to FROM tasks WHERE task_name = 'UI' LIMIT 1");

        if (tasks.length === 0) {
            console.log("❌ Task 'UI' not found. Creating it for testing...");
            // Find a user named Asi
            const users = await query("SELECT id FROM users WHERE name LIKE '%asi%' LIMIT 1");
            const asiId = users[0]?.id;

            // Find a project
            const projects = await query("SELECT project_id FROM projects LIMIT 1");
            const projectId = projects[0]?.project_id;

            if (!asiId || !projectId) {
                console.log("❌ Missing user or project for test setup.");
                process.exit(1);
            }

            await query("INSERT INTO tasks (project_id, task_name, assigned_to, status) VALUES (?, 'UI', ?, 'Pending')", [projectId, asiId]);
            console.log("✅ Created task 'UI' for testing.");
            process.exit(0); // Exit and run again
        }

        const taskId = tasks[0].task_id;
        const status = 'In Progress';
        const progress = 62;

        console.log(`Attempting update: TaskID=${taskId}, Status=${status}, Progress=${progress}`);

        // Get task info (as in taskController.js)
        const taskInfo = await query('SELECT task_name, assigned_to FROM tasks WHERE task_id = ?', [taskId]);
        const task = taskInfo[0];
        console.log("Task Info:", task);

        // Update task
        await query(
            `UPDATE tasks SET status = ?, progress = ? WHERE task_id = ?`,
            [status, progress, taskId]
        );
        console.log("✅ UPDATE tasks success.");

        // Log activity
        if (task) {
            let action = 'Updated task';
            if (status === 'Completed') action = 'Completed task';
            else if (status === 'Pending Review') action = 'Submitted for review';

            console.log(`Inserting activity log: UserID=${task.assigned_to}, TaskID=${taskId}, Action=${action}`);
            await query(
                `INSERT INTO activity_log (user_id, task_id, action, details) VALUES (?, ?, ?, ?)`,
                [task.assigned_to, taskId, action, `Task: ${task.task_name}, Progress: ${progress}%`]
            );
            console.log("✅ INSERT activity_log success.");
        }

        console.log("\n🎉 REPRODUCTION SUCCESSFUL - NO ERROR FOUND IN SCRIPT.");
        process.exit(0);
    } catch (error) {
        console.error("\n❌ REPRODUCTION FAILED WITH ERROR:");
        console.error(error);
        process.exit(1);
    }
}

reproduce();
