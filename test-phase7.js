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
  console.log('Starting Phase 7 tests...');

  // 1. Unauthenticated task request
  const unauthRes = await fetchJson('/tasks');
  if (unauthRes.status === 401) {
    console.log('✅ 1. Unauthenticated task request correctly blocked (401)');
  } else {
    console.log(`❌ 1. Expected 401, got ${unauthRes.status}`);
  }

  // Auth as ADMIN
  const loginRes = await fetchJson('/auth/login', { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@hireflow.com', password: 'Password123!' }) 
  });
  const cookie = loginRes.cookie;
  const authHeaders = { 'Content-Type': 'application/json', 'Cookie': cookie };

  // 2. Authenticated task list
  const authRes = await fetchJson('/tasks', { headers: authHeaders });
  if (authRes.status === 200 && authRes.data.success) {
    console.log('✅ 2. Authenticated task list OK');
  } else {
    console.log('❌ 2. Failed to get task list', authRes.data);
  }

  // Get a user for assignment
  const usersRes = await fetchJson('/users', { headers: authHeaders });
  const salesRep = usersRes.data.data.find(u => u.role === 'SALES_REP');

  // 7. Task creation
  const taskData = {
    title: 'Test Task Phase 7',
    priority: 'HIGH',
    assignedTo: salesRep.id
  };
  const createRes = await fetchJson('/tasks', { 
    method: 'POST', 
    headers: authHeaders,
    body: JSON.stringify(taskData) 
  });
  let taskId = null;
  if (createRes.status === 201 && createRes.data.success) {
    taskId = createRes.data.data.id;
    console.log('✅ 7. Task created successfully');
  } else {
    console.log('❌ 7. Task creation failed', createRes.data);
  }

  // 8. Invalid task creation
  const invalidRes = await fetchJson('/tasks', { 
    method: 'POST', 
    headers: authHeaders,
    body: JSON.stringify({ priority: 'HIGH' }) 
  });
  if (invalidRes.status === 400) {
    console.log('✅ 8. Invalid task creation rejected (400)');
  } else {
    console.log(`❌ 8. Expected 400, got ${invalidRes.status}`);
  }

  // 12. Task update
  if (taskId) {
    const updateRes = await fetchJson(`/tasks/${taskId}`, { 
      method: 'PATCH', 
      headers: authHeaders,
      body: JSON.stringify({ status: 'IN_PROGRESS' }) 
    });
    if (updateRes.status === 200 && updateRes.data.data.status === 'IN_PROGRESS') {
      console.log('✅ 12. Task updated successfully');
    } else {
      console.log('❌ 12. Task update failed', updateRes.data);
    }
    
    // 13. Task completion
    const completeRes = await fetchJson(`/tasks/${taskId}`, { 
      method: 'PATCH', 
      headers: authHeaders,
      body: JSON.stringify({ status: 'COMPLETED' }) 
    });
    if (completeRes.status === 200 && completeRes.data.data.status === 'COMPLETED') {
      console.log('✅ 13. Task completed successfully');
      
      // Verify activity was created
      const activitiesRes = await fetchJson('/activities', { headers: authHeaders });
      const activity = activitiesRes.data.data.find(a => a.type === 'TASK' && a.content.includes('Task completed'));
      if (activity) {
        console.log('✅ 17. Automatic activity generation on task completion');
      } else {
        console.log('❌ 17. No activity found for task completion');
      }
    }
  }

  // 18. Note creation
  const noteData = { content: 'Test note content' };
  const createNoteRes = await fetchJson('/notes', { 
    method: 'POST', 
    headers: authHeaders,
    body: JSON.stringify(noteData) 
  });
  let noteId = null;
  if (createNoteRes.status === 201) {
    noteId = createNoteRes.data.data.id;
    console.log('✅ 18. Note created successfully');
  } else {
    console.log('❌ 18. Note creation failed');
  }

  // 20. Note deletion
  if (noteId) {
    const delNoteRes = await fetchJson(`/notes/${noteId}`, { 
      method: 'DELETE', 
      headers: authHeaders 
    });
    if (delNoteRes.status === 200) {
      console.log('✅ 20. Note deleted successfully');
    } else {
      console.log('❌ 20. Note deletion failed');
    }
  }

  // Switch to SALES_REP
  const salesLogin = await fetchJson('/auth/login', { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'sales1@hireflow.com', password: 'Password123!' }) 
  });
  const salesCookie = salesLogin.cookie;
  const salesHeaders = { 'Content-Type': 'application/json', 'Cookie': salesCookie };

  // 15. Task deletion authorization
  if (taskId) {
    const delRes = await fetchJson(`/tasks/${taskId}`, { 
      method: 'DELETE', 
      headers: salesHeaders 
    });
    if (delRes.status === 403) {
      console.log('✅ 15. Task deletion authorization enforced (403)');
    } else {
      console.log(`❌ 15. Expected 403, got ${delRes.status}`);
    }
  }

  console.log('Tests completed.');
}

runTests().catch(console.error);
