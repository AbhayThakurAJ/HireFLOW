async function fetchJson(url, options = {}) {
  const res = await fetch(`http://localhost:3000/api${url}`, options);
  return { status: res.status, data: await res.json().catch(()=>({})) };
}
fetchJson('/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: 'Note 1', leadId: '00000000-0000-0000-0000-000000000000' })
}).then(console.log);
