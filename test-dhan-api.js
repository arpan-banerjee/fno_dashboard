/**
 * Test script to verify Dhan API endpoints
 * Run with: node test-dhan-api.js
 */

const axios = require('axios');

const DHAN_ACCESS_TOKEN = process.env.DHAN_ACCESS_TOKEN || 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJpc3MiOiJkaGFuIiwicGFydG5lcklkIjoiIiwiZXhwIjoxNzY0MjY2OTY5LCJpYXQiOjE3NjQxODA1NjksInRva2VuQ29uc3VtZXJUeXBlIjoiU0VMRiIsIndlYmhvb2tVcmwiOiIiLCJkaGFuQ2xpZW50SWQiOiIxMTAwNDQ4ODQxIn0.4dl8lKMi1F70RU3ORiWZfe2qUjmvcnCFafilu1Z0MA-6hjRUSaxYGXbRzjNjVq40t51W6GfeB7VbIzAFXLlKbA';
const DHAN_CLIENT_ID = process.env.DHAN_CLIENT_ID || '1100448841';

async function testDhanAPI() {
  console.log('🧪 Testing Dhan API endpoints...\n');

  // Test 1: Get NIFTY spot price
  try {
    console.log('📊 Test 1: Fetching NIFTY spot price...');
    const response = await axios.post(
      'https://api.dhan.co/v2/marketfeed/ltp',
      {
        NSE_INDEX: ['13'] // NIFTY 50
      },
      {
        headers: {
          'access-token': DHAN_ACCESS_TOKEN,
          'client-id': DHAN_CLIENT_ID,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('✅ Success! Response:', JSON.stringify(response.data, null, 2));
    console.log('');
  } catch (error) {
    console.error('❌ Failed:', error.response?.status, error.response?.data || error.message);
    console.log('');
  }

  // Test 2: Get India VIX
  try {
    console.log('📊 Test 2: Fetching India VIX...');
    const response = await axios.post(
      'https://api.dhan.co/v2/marketfeed/ltp',
      {
        NSE_INDEX: ['51'] // India VIX
      },
      {
        headers: {
          'access-token': DHAN_ACCESS_TOKEN,
          'client-id': DHAN_CLIENT_ID,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('✅ Success! Response:', JSON.stringify(response.data, null, 2));
    console.log('');
  } catch (error) {
    console.error('❌ Failed:', error.response?.status, error.response?.data || error.message);
    console.log('');
  }

  // Test 3: Get expiry dates
  try {
    console.log('📊 Test 3: Fetching NIFTY expiry dates...');
    const response = await axios.get(
      'https://api.dhan.co/v2/expiry',
      {
        params: {
          underlying: 'NIFTY'
        },
        headers: {
          'access-token': DHAN_ACCESS_TOKEN,
          'client-id': DHAN_CLIENT_ID,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('✅ Success! Response:', JSON.stringify(response.data, null, 2));
    console.log('');
  } catch (error) {
    console.error('❌ Failed:', error.response?.status, error.response?.data || error.message);
    console.log('');
  }

  // Test 4: Get option chain
  try {
    console.log('📊 Test 4: Fetching NIFTY option chain...');
    const response = await axios.get(
      'https://api.dhan.co/v2/optionchain',
      {
        params: {
          underlying: 'NIFTY',
          expiryCode: '28-NOV-2024' // Use actual expiry date
        },
        headers: {
          'access-token': DHAN_ACCESS_TOKEN,
          'client-id': DHAN_CLIENT_ID,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('✅ Success! Response (first 500 chars):', JSON.stringify(response.data, null, 2).substring(0, 500));
    console.log('');
  } catch (error) {
    console.error('❌ Failed:', error.response?.status, error.response?.data || error.message);
    console.log('');
  }

  console.log('🧪 Testing complete!');
}

testDhanAPI().catch(console.error);
