const crypto = require('crypto');

async function test() {
  const merchantCode = 'DS19623'; // Duitku Sandbox
  const apiKey = 'test';
  const amount = 50000;
  const orderId = 'TEST-' + Date.now();
  
  // POP signature: merchantCode + merchantOrderId + paymentAmount + apiKey
  const signatureString = merchantCode + orderId + amount + apiKey;
  const signature = crypto.createHash('md5').update(signatureString).digest('hex');

  const payload = {
    merchantCode,
    paymentAmount: amount,
    merchantOrderId: orderId,
    productDetails: 'Test',
    email: 'test@test.com',
    customerVaName: 'Test',
    itemDetails: [{name:'test',price:amount,quantity:1}],
    callbackUrl: 'http://localhost/cb',
    returnUrl: 'http://localhost/rt',
    signature,
    expiryPeriod: 60
  };

  const res = await fetch('https://sandbox.duitku.com/webapi/api/merchant/createInvoice', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(payload)
  });
  console.log(await res.json());
}
test().catch(console.error);
