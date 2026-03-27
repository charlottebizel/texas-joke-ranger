async function testLogin() {
  try {
    // 1. Get CSRF token and cookie
    const csrfRes = await fetch('http://localhost:3001/csrf-token');
    const csrfData = await csrfRes.json();
    const csrfToken = csrfData.csrfToken;
    const cookies = csrfRes.headers.get('set-cookie');

    // 2. Login with the CSRF token
    const loginRes = await fetch('http://localhost:3001/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': csrfToken,
        'Cookie': cookies
      },
      body: JSON.stringify({
        username: 'testuser',
        password: 'testpassword'
      })
    });

    console.log(`statusCode: ${loginRes.status}`);
    const responseData = await loginRes.text();
    console.log(responseData);

  } catch (error) {
    console.error('Test error:', error);
  }
}

testLogin();
