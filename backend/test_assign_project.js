const axios = require('axios');

async function testAssignProject() {
    try {
        console.log("1. Fetching users to find a Manager...");
        const usersRes = await axios.get('http://localhost:5001/users');
        const managers = usersRes.data.filter(u => u.role === 'Manager');

        if (managers.length === 0) {
            console.error("❌ No managers found to test with.");
            return;
        }

        const manager = managers[0];
        console.log(`✅ Found Manager: ${manager.name} (ID: ${manager.id})`);

        console.log("\n2. Assigning a new project...");
        const projectData = {
            project_name: "Test Assignment Project " + Date.now(),
            manager_id: manager.id
        };

        const createRes = await axios.post('http://localhost:5001/projects', projectData);
        console.log("✅ Project Assigned:", createRes.data);

        console.log("\n3. Verifying Manager Status...");
        const usersVerifyRes = await axios.get('http://localhost:5001/users');
        const updatedManager = usersVerifyRes.data.find(u => u.id === manager.id);

        if (updatedManager.status === 'Active') {
            console.log("✅ Manager status is Active.");
        } else {
            console.error(`❌ Manager status mismatch. Expected 'Active', got '${updatedManager.status}'`);
        }

    } catch (error) {
        console.error("❌ Test Failed:", error.response?.data || error.message);
    }
}

testAssignProject();
