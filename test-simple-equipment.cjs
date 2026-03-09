const https = require('https');

// Dados simples do novo equipamento
const equipmentData = {
  name: "Notebook Teste API",
  type: "notebook",
  brand: "Dell",
  model: "Latitude",
  serial_number: "DELL123",
  patrimony_number: "PAT456",
  condition: "novo",
  status: "disponivel",
  location: "Escritorio",
  notes: "Teste simples"
};

const data = JSON.stringify(equipmentData);
console.log('Sending data:', data);
console.log('Data length:', data.length);

const options = {
  hostname: '38c24b99-832f-4a3d-ad77-ec177e172dd1-00-1ruweyufd75y7.picard.replit.dev',
  port: 443,
  path: '/api/equipment',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
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
    
    // Se criado com sucesso, verificar no banco
    if (res.statusCode === 201 || res.statusCode === 200) {
      console.log('\n✓ Equipamento criado com sucesso!');
    } else {
      console.log('\n✗ Erro ao criar equipamento');
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(data);
req.end();