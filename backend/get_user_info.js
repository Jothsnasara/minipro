const db = require('./config/db');

async function getUsers() {
    db.query("SELECT name, username, email, role, status FROM users WHERE name LIKE '%asi%' OR username LIKE '%asi%'", (err, results) => {
        if (err) {
            console.error(err);
            process.exit(1);
        }
        console.log("--- User Information ---");
        results.forEach(user => {
            console.log(`Name: ${user.name}`);
            console.log(`Username: ${user.username}`);
            console.log(`Email: ${user.email}`);
            console.log(`Role: ${user.role}`);
            console.log(`Status: ${user.status}`);
            console.log('------------------------');
        });
        process.exit(0);
    });
}

getUsers();
