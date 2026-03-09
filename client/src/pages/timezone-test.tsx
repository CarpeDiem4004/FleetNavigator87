import { useEffect, useState } from 'react';
import { useBrazilDateTime } from '@/utils/timezone-brazil';

export default function TimezoneTest() {
  const [serverTime, setServerTime] = useState<any>(null);
  const [testDate, setTestDate] = useState<string>('');
  const brazilDateTime = useBrazilDateTime();

  useEffect(() => {
    // Fetch timezone status from server
    fetch('/api/timezone-status')
      .then(res => res.json())
      .then(data => setServerTime(data.data));
  }, []);

  const handleTestDate = () => {
    if (!testDate) return;
    
    // Test date conversion
    const utcDate = new Date(testDate + 'T00:00:00Z');
    console.log('Original input:', testDate);
    console.log('UTC date:', utcDate.toISOString());
    console.log('Brazil formatted:', brazilDateTime.formatDateTime(utcDate));
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Teste do Sistema de Timezone</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Configuração do Sistema</h2>
          {serverTime ? (
            <div className="space-y-2">
              <div>
                <strong>Backend Timezone:</strong> {serverTime.configuration.backendTimezone}
              </div>
              <div>
                <strong>Frontend Timezone:</strong> {serverTime.configuration.frontendTimezone}
              </div>
              <div>
                <strong>Padrão:</strong> {serverTime.configuration.pattern}
              </div>
            </div>
          ) : (
            <p>Carregando...</p>
          )}
        </div>

        <div className="border p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Horários Atuais</h2>
          {serverTime ? (
            <div className="space-y-2">
              <div>
                <strong>UTC (Backend):</strong> {serverTime.currentTime.utc}
              </div>
              <div>
                <strong>Brasil (Frontend):</strong> {serverTime.currentTime.brazilPreview}
              </div>
              <div>
                <strong>Sistema:</strong> {serverTime.currentTime.systemTime}
              </div>
            </div>
          ) : (
            <p>Carregando...</p>
          )}
        </div>

        <div className="border p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Teste de Conversão</h2>
          <div className="space-y-2">
            <div>
              <label className="block text-sm font-medium mb-1">
                Data para teste (YYYY-MM-DD):
              </label>
              <input
                type="date"
                value={testDate}
                onChange={(e) => setTestDate(e.target.value)}
                className="border rounded px-2 py-1"
              />
            </div>
            <button
              onClick={handleTestDate}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Testar Conversão
            </button>
          </div>
        </div>

        <div className="border p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Utilitários Disponíveis</h2>
          <div className="space-y-2 text-sm">
            <div>
              <strong>Frontend:</strong>
              <ul className="list-disc ml-4">
                <li>formatDate() - Formata data para DD/MM/YYYY</li>
                <li>formatDateTime() - Formata data e hora brasileira</li>
                <li>formatTime() - Formata apenas hora</li>
                <li>getCurrentTime() - Obtém hora atual do Brasil</li>
                <li>toUTC() - Converte para UTC (envio ao backend)</li>
              </ul>
            </div>
            <div>
              <strong>Backend:</strong>
              <ul className="list-disc ml-4">
                <li>getCurrentUTC() - Obtém hora atual em UTC</li>
                <li>ensureUTC() - Garante que data está em UTC</li>
                <li>processInputDates() - Processa datas de entrada</li>
                <li>processDatabaseResults() - Processa resultados do banco</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-green-100 rounded">
        <h3 className="font-semibold text-green-800 mb-2">✅ Sistema Corrigido</h3>
        <p className="text-green-700">
          O sistema agora segue as melhores práticas internacionais:
        </p>
        <ul className="list-disc ml-4 text-green-700 mt-2">
          <li>Backend armazena dados em UTC</li>
          <li>Frontend converte para timezone local (Brasil)</li>
          <li>Supabase recebe dados em UTC</li>
          <li>Usuários veem horários em horário brasileiro</li>
        </ul>
      </div>
    </div>
  );
}