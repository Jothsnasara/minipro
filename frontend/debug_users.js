import axios from 'axios';

async function checkUsers() {
    try {
        console.log("Fetching users from http://localhost:5000/users...");
        const response = await axios.get('http://localhost:5000/users');
        const users = response.data;
        console.log(`Found ${users.length} users.`);

        console.log("--------------------------------------------------");
        console.log("ID | Name | Role | Status");
        console.log("--------------------------------------------------");

        users.forEach(u => {
            console.log(`${u.id} | ${u.name} | '${u.role}' | ${u.status}`);
        });

        console.log("--------------------------------------------------");

        const managers = users.filter(u => u.role && u.role.toLowerCase() === 'manager');
        console.log(`Debug Filter (toLowerCase): Found ${managers.length} managers.`);

    } catch (error) {
        console.error("Error fetching users:", error.message);
    }
}

checkUsers();
