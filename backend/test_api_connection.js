const axios = require('axios');

async function testApi() {
    const baseUrl = 'http://localhost:5001';

    console.log(`Testing connection to ${baseUrl}...`);

    try {
        const ping = await axios.get(`${baseUrl}/users`);
        console.log("✅ GET /users: Success");
    } catch (err) {
        console.error("❌ GET /users: Failed", err.message);
    }

    try {
        const pingApi = await axios.get(`${baseUrl}/api/users`);
        console.log("✅ GET /api/users: Success");
    } catch (err) {
        console.error("❌ GET /api/users: Failed", err.message);
    }

    try {
        // Test a dummy POST to see if the route exists (we expect 400, not 404)
        await axios.post(`${baseUrl}/api/tasks`, {});
        console.log("✅ POST /api/tasks: Route exists (surprising, expected 400)");
    } catch (err) {
        if (err.response) {
            if (err.response.status === 404) {
                console.error("❌ POST /api/tasks: FAILED with 404 (Route not found)");
            } else {
                console.log(`✅ POST /api/tasks: Route exists (Got status ${err.response.status}: ${JSON.stringify(err.response.data)})`);
            }
        } else {
            console.error("❌ POST /api/tasks: Connection failed", err.message);
        }
    }
}

testApi();
