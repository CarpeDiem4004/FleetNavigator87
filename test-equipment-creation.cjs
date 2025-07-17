const https = require('https');

// Dados do novo equipamento
const equipmentData = {
  name: "Notebook Dell Teste",
  type: "notebook",
  brand: "Dell",
  model: "Latitude 5420",
  serial_number: "DELL789456",
  patrimony_number: "PAT123",
  condition: "novo",
  status: "disponivel",
  location: "Escritório Central",
  notes: "Teste de criação via API - " + new Date().toISOString()
};

const data = JSON.stringify(equipmentData);

const options = {
  hostname: '38c24b99-832f-4a3d-ad77-ec177e172dd1-00-1ruweyufd75y7.picard.replit.dev',
  port: 443,
  path: '/api/equipment-create',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    'Cookie': 'connect.sid=s%3A-A10NDgEuXYtblQJMQKkdBCaM9CFP6o2.UueyZJKmG0UKHnPMZF0n8%2Bi5J8%2B2Ar7idcJy5uLdON0'
  }
};

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', responseData);
    try {
      const json = JSON.parse(responseData);
      console.log('Parsed response:', JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('Raw response:', responseData);
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(data);
req.end();