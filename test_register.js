const username = `testuser_${Math.floor(Math.random() * 10000)}`;
const password = 'testpassword';

async function testRegister() {
  try {
    // 1. Get CSRF token and cookie
    const csrfRes = await fetch('http://localhost:3001/csrf-token');
    const csrfData = await csrfRes.json();
    const csrfToken = csrfData.csrfToken;
    
    const csrfCookie = csrfRes.headers.get('set-cookie');

    // 2. Register user
    const registerRes = await fetch('http://localhost:3001/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': csrfToken,
        'Cookie': csrfCookie
      },
      body: JSON.stringify({ username, password })
    });

    console.log(`statusCode: ${registerRes.status}`);
    if (registerRes.status === 201) {
      console.log('Registration successful!');
    } else {
      console.error('Registration failed!');
    }

    const responseData = await registerRes.text();
    console.log(responseData);

  } catch (error) {
    console.error('Test error:', error);
  }
}

testRegister();
