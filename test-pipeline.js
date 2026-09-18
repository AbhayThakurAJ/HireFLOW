import fetch from 'node-fetch';
const res = await fetch('http://localhost:3000/api/deals?limit=1000', {
  headers: {
    'Cookie': 'token=xxx' // we might need a real token or mock
  }
});
console.log(res.status);
console.log(await res.text());
