const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach((line) => {
    line = line.trim();
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) process.env[match[1]] = match[2];
  });
}

async function test() {
  try {
    const sign = crypto.createHash('md5').update(process.env.DIGIFLAZZ_USERNAME + process.env.DIGIFLAZZ_API_KEY + 'REF_TESTING_123').digest('hex');
    await axios.post('https://api.digiflazz.com/v1/transaction', { 
      username: process.env.DIGIFLAZZ_USERNAME, 
      buyer_sku_code: 'ml5', 
      customer_no: '84201379912337', 
      ref_id: 'REF_TESTING_123', 
      sign, 
      testing: true 
    });
  } catch (e) {
    console.log(JSON.stringify(e.response?.data || e.message, null, 2));
  }
}
test();
