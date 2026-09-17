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
  console.log('Starting Phase 8 Dashboard tests...');

  // 1. Unauthenticated request
  const unauthRes = await fetchJson('/dashboard/stats');
  if (unauthRes.status === 401) {
    console.log('✅ 1. Unauthenticated request blocked');
  } else {
    console.log('❌ 1. Expected 401, got', unauthRes.status);
  }

  // Auth as ADMIN
  const loginRes = await fetchJson('/auth/login', { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@hireflow.com', password: 'Password123!' }) 
  });
  const authHeaders = { 'Content-Type': 'application/json', 'Cookie': loginRes.cookie };

  // 2. ADMIN dashboard access
  const statsRes = await fetchJson('/dashboard/stats', { headers: authHeaders });
  if (statsRes.status === 200 && statsRes.data.success) {
    console.log('✅ 2. ADMIN stats access OK');
  } else {
    console.log('❌ 2. ADMIN stats access failed');
  }

  // 3. Pipeline aggregation
  const pipeRes = await fetchJson('/dashboard/pipeline', { headers: authHeaders });
  if (pipeRes.status === 200 && Array.isArray(pipeRes.data.data)) {
    console.log('✅ 3. Pipeline aggregation OK');
  } else {
    console.log('❌ 3. Pipeline aggregation failed');
  }

  // 4. Revenue aggregation
  const revRes = await fetchJson('/dashboard/revenue', { headers: authHeaders });
  if (revRes.status === 200) {
    console.log('✅ 4. Revenue aggregation OK');
  } else {
    console.log('❌ 4. Revenue aggregation failed');
  }

  // 5. Leads aggregation
  const leadsRes = await fetchJson('/dashboard/leads', { headers: authHeaders });
  if (leadsRes.status === 200 && leadsRes.data.data.metrics) {
    console.log('✅ 5. Leads aggregation OK');
  } else {
    console.log('❌ 5. Leads aggregation failed');
  }

  // 6. Sales Performance
  const perfRes = await fetchJson('/dashboard/performance', { headers: authHeaders });
  if (perfRes.status === 200) {
    console.log('✅ 6. Sales performance OK');
  } else {
    console.log('❌ 6. Sales performance failed');
  }

  // 7. Date filtering
  const now = new Date();
  const past = new Date();
  past.setDate(past.getDate() - 30);
  const dateParams = `?from=${past.toISOString()}&to=${now.toISOString()}`;
  const dateRes = await fetchJson(`/dashboard/stats${dateParams}`, { headers: authHeaders });
  if (dateRes.status === 200) {
    console.log('✅ 7. Date filtering OK');
  } else {
    console.log('❌ 7. Date filtering failed');
  }

  // Auth as SALES_REP
  const salesLogin = await fetchJson('/auth/login', { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'sales1@hireflow.com', password: 'Password123!' }) 
  });
  const salesHeaders = { 'Content-Type': 'application/json', 'Cookie': salesLogin.cookie };

  // 8. SALES_REP access
  const salesStatsRes = await fetchJson('/dashboard/stats', { headers: salesHeaders });
  if (salesStatsRes.status === 200) {
    console.log('✅ 8. SALES_REP access OK');
  } else {
    console.log('❌ 8. SALES_REP access failed');
  }
}

runTests();
