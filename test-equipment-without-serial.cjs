const https = require('https');

// Dados do novo equipamento sem número de série
const equipmentData = {
  name: "Dell Celular Teste",
  type: "celular",
  brand: "Dell",
  model: "",
  serial_number: "",
  patrimony_number: "",
  condition: "novo",
  status: "disponivel",
  location: "",
  notes: "Teste sem número de série"
};

const data = JSON.stringify(equipmentData);
console.log('Enviando equipamento sem número de série...');

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
    if (res.statusCode === 201 || res.statusCode === 200) {
      const result = JSON.parse(responseData);
      console.log('\n✓ Equipamento criado com sucesso!');
      console.log('ID:', result.data.id);
      console.log('Nome:', result.data.name);
      console.log('Número de série:', result.data.serial_number || '(vazio - NULL)');
    } else {
      console.log('\n✗ Erro:', responseData);
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(data);
req.end();