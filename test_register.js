const http = require('http');

const username = `testuser_${Math.floor(Math.random() * 10000)}`;
const password = 'testpassword';

const getTokenOptions = {
    hostname: 'localhost',
    port: 3001,
    path: '/csrf-token',
    method: 'GET',
};

const getTokenReq = http.request(getTokenOptions, (res) => {
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
        const { csrfToken } = JSON.parse(rawData);
        const csrfCookie = res.headers['set-cookie'].find(cookie => cookie.startsWith('csrf-token='));

        const registerData = JSON.stringify({
          username: username,
          password: password
        });

        const registerOptions = {
          hostname: 'localhost',
          port: 3001,
          path: '/register',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': registerData.length,
            'x-csrf-token': csrfToken,
            'Cookie': csrfCookie
          }
        };

        const registerReq = http.request(registerOptions, (res) => {
          console.log(`statusCode: ${res.statusCode}`);

          if (res.statusCode === 201) {
            console.log('Inscription réussie !');
          } else {
            console.error('L\'inscription a échoué !');
          }

          res.on('data', (d) => {
            process.stdout.write(d);
          });
        });

        registerReq.on('error', (error) => {
          console.error(error);
        });

        registerReq.write(registerData);
        registerReq.end();
    });
});

getTokenReq.on('error', (error) => {
    console.error(error);
});

getTokenReq.end();
