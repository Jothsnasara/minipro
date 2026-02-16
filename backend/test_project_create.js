const http = require('http');

const data = JSON.stringify({
    project_name: "Test Project",
    description: "Test Description",
    budget: 1000,
    start_date: "2023-01-01",
    end_date: "2023-12-31",
    manager_id: null,
    status: "Planning"
});

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/projects',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

console.log("Sending POST request to http://localhost:5000/projects...");

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);

    res.on('data', (d) => {
        process.stdout.write(d);
    });
});

req.on('error', (error) => {
    console.error("Error:", error);
});

req.write(data);
req.end();
