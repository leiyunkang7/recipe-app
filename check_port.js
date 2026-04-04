// Check if localhost:3000 is running
const http = require('http');

const req = http.get('http://localhost:3000', (res) => {
  console.log('Status:', res.statusCode);
  process.exit(0);
});

req.on('error', (e) => {
  console.log('Error:', e.message);
  process.exit(1);
});

req.setTimeout(5000, () => {
  console.log('Timeout - server not responding');
  process.exit(1);
});