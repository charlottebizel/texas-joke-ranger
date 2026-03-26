const http = require('http');

// Step 1: Get CSRF token
const getCsrfOptions = {
  hostname: 'localhost',
  port: 3001,
  path: '/csrf-token',
  method: 'GET',
};

const csrfReq = http.request(getCsrfOptions, (csrfRes) => {
  let csrfData = '';
  csrfRes.on('data', (chunk) => {
    csrfData += chunk;
  });
  csrfRes.on('end', () => {
    const { csrfToken } = JSON.parse(csrfData);
    const cookie = csrfRes.headers['set-cookie'];

    // Step 2: Login with CSRF token
    const loginData = JSON.stringify({
      username: 'testuser',
      password: 'testpassword'
    });

    const loginOptions = {
      hostname: 'localhost',
      port: 3001,
      path: '/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': loginData.length,
        'x-csrf-token': csrfToken,
        'Cookie': cookie
      }
    };

    const loginReq = http.request(loginOptions, (loginRes) => {
      console.log(`statusCode: ${loginRes.statusCode}`);
      let responseData = '';
      loginRes.on('data', (d) => {
        responseData += d;
      });
      loginRes.on('end', () => {
        console.log(responseData);
      });
    });

    loginReq.on('error', (error) => {
      console.error(error);
    });

    loginReq.write(loginData);
    loginReq.end();
  });
});

csrfReq.on('error', (error) => {
  console.error(error);
});

csrfReq.end();
