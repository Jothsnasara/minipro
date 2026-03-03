const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function testUpdate() {
    try {
        console.log("Finding a task to update...");
        // Use user ID 3 from the screenshot (Asi)
        const resTasks = await axios.get('http://localhost:5001/api/member/tasks/3');
        if (resTasks.data.length === 0) {
            console.log("No tasks found for user 3");
            process.exit(0);
        }

        const task = resTasks.data[0];
        console.log(`Updating task ${task.id}: ${task.title}`);

        const updateData = {
            status: 'In Progress',
            progress: 63
        };

        const resUpdate = await axios.put(`http://localhost:5001/api/member/tasks/${task.id}`, updateData);
        console.log("Update response:", resUpdate.data);
    } catch (error) {
        console.error("Update failed!");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", error.response.data);
        } else {
            console.error("Message:", error.message);
        }
    }
}

testUpdate();
