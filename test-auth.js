// Simple test script to test authentication
const testAuth = async () => {
  const baseUrl = 'http://127.0.0.1:3000';
  
  console.log('Testing authentication endpoints...');
  
  // Test registration
  try {
    const registerData = {
      name: 'Test User ' + Date.now(),
      email: `test${Date.now()}@example.com`,
      password: 'password123'
    };
    
    console.log('Testing registration...');
    const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(registerData)
    });
    
    const registerResult = await registerResponse.json();
    console.log('Register response:', registerResult);
    
    if (registerResult.success) {
      console.log('✅ Registration successful');
      
      // Test login with the same credentials
      console.log('Testing login...');
      const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          email: registerData.email,
          password: registerData.password
        })
      });
      
      const loginResult = await loginResponse.json();
      console.log('Login response:', loginResult);
      
      if (loginResult.success) {
        console.log('✅ Login successful');
        
        // Test protected route
        console.log('Testing protected route...');
        const profileResponse = await fetch(`${baseUrl}/api/auth/profile`, {
          headers: {
            'Authorization': `Bearer ${loginResult.token}`
          },
          credentials: 'include'
        });
        
        const profileResult = await profileResponse.json();
        console.log('Profile response:', profileResult);
        
        if (profileResult.success) {
          console.log('✅ Protected route access successful');
        } else {
          console.log('❌ Protected route access failed');
        }
      } else {
        console.log('❌ Login failed');
      }
    } else {
      console.log('❌ Registration failed');
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run the test if this is run directly with Node.js
if (typeof window === 'undefined') {
  // Node.js environment
  const fetch = (await import('node-fetch')).default;
  testAuth();
} else {
  // Browser environment
  window.testAuth = testAuth;
  console.log('Test function available as window.testAuth()');
}