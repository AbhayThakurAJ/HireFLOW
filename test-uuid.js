async function run() {
  const resAuth = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@hireflow.com', password: 'Password123!' })
  });
  const cookie = resAuth.headers.get('set-cookie').split(';')[0];
  const res = await fetch('http://localhost:3000/api/companies/invalid-uuid', {
    headers: { 'Cookie': cookie }
  });
  console.log('Status:', res.status);
}
run();
