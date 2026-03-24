const http = require('http');

const data = JSON.stringify({
  username: 'testuser',
  password: 'testpassword'
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`statusCode: ${res.statusCode}`);
  
  const csrfCookie = res.headers['set-cookie'].find(cookie => cookie.startsWith('csrf-token='));

  if (csrfCookie) {
    console.log('Cookie CSRF trouvé !');
  } else {
    console.error('Cookie CSRF non trouvé !');
  }

  res.on('data', (d) => {
    process.stdout.write(d);
  });
});

req.on('error', (error) => {
  console.error(error);
});

req.write(data);
req.end();
