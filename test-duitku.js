require('ts-node').register({ transpileOnly: true });
const mongoose = require('mongoose');
const crypto = require('crypto');
const PaymentConfig = require('./src/models/PaymentConfig').default;

async function test() {
  await mongoose.connect('mongodb://127.0.0.1:27017/game-topup');
  const config = await PaymentConfig.findOne({});
  
  if (!config) return console.log('No config');

  const merchantCode = config.duitkuMerchantCode;
  const apiKey = config.duitkuApiKey;
  const isProd = config.duitkuIsProduction;
  const endpoint = isProd 
    ? 'https://passport.duitku.com/webapi/api/merchant/v2/inquiry' 
    : 'https://sandbox.duitku.com/webapi/api/merchant/v2/inquiry';

  const orderId = 'TEST-' + Date.now();
  const amount = 50000;
  
  // Format 1: merchantCode + merchantOrderId + paymentAmount + apiKey
  const signatureString1 = merchantCode + orderId + amount + apiKey;
  const signature1 = crypto.createHash('md5').update(signatureString1).digest('hex');

  // Format 2: merchantCode + paymentAmount + merchantOrderId + apiKey
  const signatureString2 = merchantCode + amount + orderId + apiKey;
  const signature2 = crypto.createHash('md5').update(signatureString2).digest('hex');

  const payload = {
    merchantCode,
    paymentAmount: amount,
    merchantOrderId: orderId,
    productDetails: 'Test Order',
    email: 'test@test.com',
    customerVaName: 'Test Name',
    itemDetails: [{name: 'Test', price: amount, quantity: 1}],
    callbackUrl: 'http://localhost:3000/api',
    returnUrl: 'http://localhost:3000',
    signature: signature1,
    expiryPeriod: 60,
  };

  console.log("Testing Format 1 (merchantCode + orderId + amount + apiKey)");
  let res = await fetch(endpoint, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(payload)
  });
  console.log(await res.json());

  console.log("Testing Format 2 (merchantCode + amount + orderId + apiKey)");
  payload.signature = signature2;
  res = await fetch(endpoint, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(payload)
  });
  console.log(await res.json());

  process.exit(0);
}
test().catch(console.error);
