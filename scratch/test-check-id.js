const axios = require('axios');

// Codashop API validation for HOK & Genshin
async function checkCodashop(gameName, userId, zoneId) {
  try {
    const res = await axios.post('https://order-sg.codashop.com/initPayment.action', {
      voucherPricePoint: {
        variablePrice: 0,
        price: 0
      },
      user: {
        userId: userId,
        zoneId: zoneId || ""
      }
    }, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });
    console.log(`[Codashop ${gameName}] Result:`, res.data);
    return res.data;
  } catch (err) {
    console.log(`[Codashop ${gameName}] Error:`, err.message);
    return null;
  }
}

// Public API endpoints used by topup games in ID
async function checkPublicAPI(slug, userId, zoneId) {
  const urls = [
    `https://api.viphoyoverse.com/api/cek-role?game=${slug}&id=${userId}&zone=${zoneId || ''}`,
    `https://api.layananmlbb.com/api/check-id?game=${slug}&user_id=${userId}&zone_id=${zoneId || ''}`,
    `https://v1.apigames.id/merchant/cek-role?code=${slug}&id=${userId}`
  ];

  for (const url of urls) {
    try {
      const res = await axios.get(url, { timeout: 3000 });
      console.log(`[Public API ${url}] SUCCESS:`, res.data);
    } catch (err) {
      console.log(`[Public API ${url}] ERROR:`, err.message);
    }
  }
}

async function run() {
  console.log("--- Testing Genshin via Enka Network ---");
  try {
    const enkaRes = await axios.get("https://enka.network/api/uid/800000000", { timeout: 5000 });
    console.log("Enka Genshin Nickname:", enkaRes.data?.playerInfo?.nickname);
  } catch (e) {
    console.log("Enka Genshin Err:", e.message);
  }

  console.log("\n--- Testing HOK Public APIs ---");
  await checkPublicAPI('hok', '1234567890');
}

run();
