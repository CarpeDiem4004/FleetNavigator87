/**
 * Script para testar a API de projetos simulando um dispositivo móvel
 */

import fetch from 'node-fetch';

async function testMobileProjectsAPI() {
  const baseUrl = process.env.REPLIT_DEV_DOMAIN 
    ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
    : 'http://localhost:3000';
  
  console.log('🔍 Testando API de projetos para dispositivos móveis...');
  console.log(`📍 URL Base: ${baseUrl}`);
  
  const endpoints = [
    '/api/public/projects-with-bases',
    '/api/projects-with-bases'
  ];
  
  for (const endpoint of endpoints) {
    console.log(`\n📱 Testando endpoint: ${endpoint}`);
    
    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Mobile-Request': 'true',
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        timeout: 20000
      });
      
      console.log(`✅ Status: ${response.status} ${response.statusText}`);
      console.log(`📋 Headers de resposta:`, Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const data = await response.json();
        console.log(`📊 Dados recebidos:`, {
          success: data.success,
          dataType: Array.isArray(data.data) ? 'array' : typeof data.data,
          projectCount: Array.isArray(data.data) ? data.data.length : 0,
          totalBases: Array.isArray(data.data) ? data.data.reduce((acc, p) => acc + (p.bases?.length || 0), 0) : 0
        });
        
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          console.log(`🎉 Endpoint ${endpoint} funcionando corretamente!`);
          console.log(`📈 Projetos: ${data.data.length}, Bases: ${data.data.reduce((acc, p) => acc + (p.bases?.length || 0), 0)}`);
          return true;
        } else {
          console.log(`⚠️ Endpoint ${endpoint} retornou dados inválidos`);
        }
      } else {
        const errorText = await response.text();
        console.log(`❌ Erro HTTP: ${errorText}`);
      }
    } catch (error) {
      console.log(`💥 Erro na requisição: ${error.message}`);
    }
  }
  
  return false;
}

if (require.main === module) {
  testMobileProjectsAPI()
    .then(success => {
      if (success) {
        console.log('\n✅ Teste concluído: API funcionando para mobile');
        process.exit(0);
      } else {
        console.log('\n❌ Teste concluído: API com problemas para mobile');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Erro no teste:', error);
      process.exit(1);
    });
}

module.exports = { testMobileProjectsAPI };