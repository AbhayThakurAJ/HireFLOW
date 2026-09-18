const BASE_URL = 'http://localhost:3000/api';

async function test() {
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@hireflow.com', password: 'Password123!' })
  });
  const cookie = loginRes.headers.get('set-cookie');
  
  const leadRes = await fetch(`${BASE_URL}/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
    body: JSON.stringify({
      firstName: "Test",
      lastName: "User",
      email: "",
      phone: "",
      company: "",
      jobTitle: "",
      source: "OTHER",
      status: "NEW",
      assignedTo: "",
      notes: ""
    })
  });
  
  console.log(leadRes.status);
  console.log(await leadRes.json());
}
test();
