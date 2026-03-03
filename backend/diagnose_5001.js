const axios = require('axios');
const { exec } = require('child_process');

async function diagnose() {
    console.log("--- Server Port Check ---");
    exec('netstat -ano | findstr :5001', (err, stdout, stderr) => {
        if (stdout) {
            console.log("Processes on port 5001:");
            console.log(stdout);
        } else {
            console.log("No process found on port 5001 via netstat.");
        }
    });

    console.log("\n--- API Route Check ---");
    const baseUrl = 'http://localhost:5001';

    const endpoints = [
        '/users',
        '/projects',
        '/api/users',
        '/api/tasks'
    ];

    for (const endpoint of endpoints) {
        try {
            const res = await axios({
                method: endpoint === '/api/tasks' ? 'POST' : 'GET',
                url: `${baseUrl}${endpoint}`,
                data: endpoint === '/api/tasks' ? {} : undefined
            });
            console.log(`✅ ${endpoint}: Success (${res.status})`);
        } catch (err) {
            if (err.response) {
                console.log(`❌ ${endpoint}: Failed with ${err.response.status}`);
                if (err.response.data) console.log(`   Response: ${JSON.stringify(err.response.data)}`);
            } else {
                console.log(`❌ ${endpoint}: Connection Error: ${err.message}`);
            }
        }
    }
}

diagnose();
