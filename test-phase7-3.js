async function fetchJson(url, options = {}) {
  const res = await fetch(`http://localhost:3000/api${url}`, options);
  const data = await res.json().catch(() => ({}));
  let cookie = '';
  if (res.headers.getSetCookie) {
    const cookies = res.headers.getSetCookie();
    if (cookies && cookies.length > 0) {
      cookie = cookies[0].split(';')[0];
    }
  } else {
     const c = res.headers.get('set-cookie');
     if (c) cookie = c.split(';')[0];
  }
  return { status: res.status, data, cookie };
}

async function runTests() {
  const loginRes = await fetchJson('/auth/login', { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@hireflow.com', password: 'Password123!' }) 
  });
  const headers = { 'Content-Type': 'application/json', 'Cookie': loginRes.cookie };

  const n1 = await fetchJson('/notes', {
      method: 'POST', headers, body: JSON.stringify({ content: 'Note 1', leadId: '00000000-0000-0000-0000-000000000000' })
  });
  console.log('Note invalid lead ADMIN:', n1.status, n1.data);
}
runTests();
