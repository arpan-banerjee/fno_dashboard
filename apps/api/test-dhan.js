const axios = require('axios');

async function testDhanIntegration() {
  try {
    console.log('🔐 Step 1: Login to get token...');
    const loginResponse = await axios.post('http://localhost:4000/auth/login', {
      email: 'primexa1967@gmail.com',
      password: 'ChangeMe!123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful, token received');
    
    console.log('\n📊 Step 2: Testing Dhan spot price fetch...');
    const spotResponse = await axios.get('http://localhost:4000/market/spot-price', {
      params: { symbol: 'NIFTY' },
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Spot price response:', JSON.stringify(spotResponse.data, null, 2));
    
    // Test other symbols
    console.log('\n📊 Step 3: Testing BANKNIFTY...');
    const bankNiftyResponse = await axios.get('http://localhost:4000/market/spot-price', {
      params: { symbol: 'BANKNIFTY' },
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ BANKNIFTY spot price:', JSON.stringify(bankNiftyResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Response details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testDhanIntegration();
