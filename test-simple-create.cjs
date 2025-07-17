const https = require('https');

// Dados simples
const equipmentData = {
  name: "Dell Test",
  type: "celular",
  brand: "Dell",
  model: "X100",
  serial_number: "",
  patrimony_number: "",
  condition: "novo",
  status: "disponivel",
  location: "Office",
  notes: "Test"
};

const data = JSON.stringify(equipmentData);
console.log('JSON:', data);
console.log('Length:', data.length);

const options = {
  hostname: '38c24b99-832f-4a3d-ad77-ec177e172dd1-00-1ruweyufd75y7.picard.replit.dev',
  port: 443,
  path: '/api/equipment',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
    'Cookie': 'connect.sid=s%3A-A10NDgEuXYtblQJMQKkdBCaM9CFP6o2.UueyZJKmG0UKHnPMZF0n8%2Bi5J8%2B2Ar7idcJy5uLdON0'
  }
};

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  
  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', responseData);
    if (res.statusCode === 201) {
      const result = JSON.parse(responseData);
      console.log('\n✓ Success! ID:', result.data.id);
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(data);
req.end();