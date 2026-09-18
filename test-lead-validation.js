const BASE_URL = 'http://localhost:3000/api';

async function test() {
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@hireflow.com', password: 'Password123!' })
  });
  const cookie = loginRes.headers.get('set-cookie');
  
  // Test 1: Full empty strings
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
  
  if (leadRes.status !== 201) throw new Error('Failed ' + await leadRes.text());
  
  // Test 2: Full nulls
  const leadRes2 = await fetch(`${BASE_URL}/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
    body: JSON.stringify({
      firstName: "Test2",
      lastName: "User2",
      email: null,
      phone: null,
      company: null,
      jobTitle: null,
      source: "OTHER",
      status: "NEW",
      assignedTo: null,
      notes: null
    })
  });
  // Note: Zod might not accept null for email since it's optional() but not nullable(). 
  // Let's see how it behaves. If it fails, that's expected since frontend never sends null for these strings.
  console.log('Test 2:', leadRes2.status);
  console.log("Validation test complete");
}
test();
