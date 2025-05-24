import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Fuel, TruckIcon, Truck, History } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { POSTO_OSASCO_V2, NOME_POSTO_OSASCO_V2 } from '@/constants/postos';
import { useToast } from '@/hooks/use-toast';

/**
 * Versão simplificada e autônoma do formulário de abastecimento para Osasco V2
 * Esta versão não usa componentes sofisticados para evitar problemas no DOM em dispositivos móveis
 */
const SimplifiedAbastecimentoForm: React.FC = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    placa: '',
    km: '',
    tipo_combustivel: '',
    quantidade_litros: '',
    valor_litro: '6.39',
    valor_total: '',
    projeto: '',
    motorista_nome: '',
    motorista_rg: '',
    operador: '',
    tipo_veiculo: 'frota',
    observacoes: ''
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Calcular valor total quando a quantidade ou valor unitário mudar
    if (name === 'quantidade_litros' || name === 'valor_litro') {
      const quantidade = name === 'quantidade_litros' ? value : formData.quantidade_litros;
      const valorLitro = name === 'valor_litro' ? value : formData.valor_litro;
      
      if (quantidade && valorLitro) {
        const total = parseFloat(quantidade) * parseFloat(valorLitro);
        setFormData(prev => ({
          ...prev,
          valor_total: total.toFixed(2)
        }));
      }
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    // Validação básica
    if (!formData.placa || !formData.km || !formData.tipo_combustivel || 
        !formData.quantidade_litros || !formData.projeto || 
        !formData.motorista_nome || !formData.motorista_rg || !formData.operador) {
      toast({
        title: "Formulário incompleto",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Estruturar dados conforme esperado pela API
      const dadosFormatados = {
        posto: POSTO_OSASCO_V2,
        data: {
          placa: formData.placa.toUpperCase(),
          km_atual: parseFloat(formData.km),
          tipo_combustivel: formData.tipo_combustivel,
          quantidade_litros: parseFloat(formData.quantidade_litros),
          valor_litro: parseFloat(formData.valor_litro),
          valor_total: parseFloat(formData.valor_total || '0'),
          projeto: formData.projeto,
          motorista: formData.motorista_nome,
          motorista_rg: formData.motorista_rg,
          operador: formData.operador,
          tipo_veiculo: formData.tipo_veiculo,
          observacoes: formData.observacoes
        }
      };
      
      console.log("Enviando dados:", dadosFormatados);
      
      // Enviar para a API
      const response = await fetch('/api/abastecimento-direto/osasco_v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dadosFormatados)
      });
      
      const resultado = await response.json();
      
      if (resultado.success) {
        // Sucesso
        toast({
          title: "Abastecimento registrado",
          description: "Registro salvo com sucesso!",
        });
        
        // Limpar formulário
        setFormData({
          placa: '',
          km: '',
          tipo_combustivel: '',
          quantidade_litros: '',
          valor_litro: '6.39',
          valor_total: '',
          projeto: '',
          motorista_nome: '',
          motorista_rg: '',
          operador: '',
          tipo_veiculo: 'frota',
          observacoes: ''
        });
        
        // Recarregar histórico
        setTimeout(() => {
          // Atualizar a lista de histórico, ou recarregar a página se necessário
          window.location.reload();
        }, 1500);
      } else {
        // Erro
        toast({
          title: "Erro ao registrar",
          description: resultado.message || "Ocorreu um erro ao salvar o registro.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erro ao enviar formulário:", error);
      toast({
        title: "Erro no servidor",
        description: "Não foi possível conectar ao servidor. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Lista de projetos fixa para evitar problemas com selects dinâmicos
  const projetos = [
    'GRUPO PEREIRA',
    'COCA COLA',
    'SHOPEE', 
    'MERCADO LIVRE',
    'LINE HALL SHOPEE',
    'FULL MELI',
    'MADEIRA MADEIRA',
    'MAGALU',
    'NATURA',
    'OXXO',
    'PETLOVE',
    'REMÉDIOS'
  ];
  
  return (
    <TabsContent value="abastecimento" className="mt-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Dados do veículo e motorista */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="placa" className="block text-sm font-medium">
              Placa do Veículo*
            </label>
            <input
              type="text"
              id="placa"
              name="placa"
              value={formData.placa}
              onChange={handleChange}
              className="w-full p-2 border rounded text-base"
              style={{ fontSize: '16px', minHeight: '42px' }}
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="km" className="block text-sm font-medium">
              Hodômetro / KM*
            </label>
            <input
              type="number"
              id="km"
              name="km"
              value={formData.km}
              onChange={handleChange}
              className="w-full p-2 border rounded text-base"
              style={{ fontSize: '16px', minHeight: '42px' }}
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="projeto" className="block text-sm font-medium">
              Projeto*
            </label>
            <select
              id="projeto"
              name="projeto"
              value={formData.projeto}
              onChange={handleChange}
              className="w-full p-2 border rounded text-base"
              style={{ 
                fontSize: '16px', 
                minHeight: '42px',
                WebkitAppearance: 'menulist',
                appearance: 'menulist'
              }}
              required
            >
              <option value="">Selecione um projeto</option>
              {projetos.map((projeto) => (
                <option key={projeto} value={projeto}>
                  {projeto}
                </option>
              ))}
            </select>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="motorista_nome" className="block text-sm font-medium">
              Nome do Motorista*
            </label>
            <input
              type="text"
              id="motorista_nome"
              name="motorista_nome"
              value={formData.motorista_nome}
              onChange={handleChange}
              className="w-full p-2 border rounded text-base"
              style={{ fontSize: '16px', minHeight: '42px' }}
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="motorista_rg" className="block text-sm font-medium">
              RG do Motorista*
            </label>
            <input
              type="text"
              id="motorista_rg"
              name="motorista_rg"
              value={formData.motorista_rg}
              onChange={handleChange}
              className="w-full p-2 border rounded text-base"
              style={{ fontSize: '16px', minHeight: '42px' }}
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="operador" className="block text-sm font-medium">
              Operador*
            </label>
            <input
              type="text"
              id="operador"
              name="operador"
              value={formData.operador}
              onChange={handleChange}
              className="w-full p-2 border rounded text-base"
              style={{ fontSize: '16px', minHeight: '42px' }}
              required
            />
          </div>
        </div>
        
        {/* Dados do abastecimento */}
        <div className="border-t pt-4 mt-4">
          <h3 className="font-medium mb-3">Dados do Abastecimento</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label htmlFor="tipo_combustivel" className="block text-sm font-medium">
                Tipo de Combustível*
              </label>
              <select
                id="tipo_combustivel"
                name="tipo_combustivel"
                value={formData.tipo_combustivel}
                onChange={handleChange}
                className="w-full p-2 border rounded text-base"
                style={{ 
                  fontSize: '16px', 
                  minHeight: '42px',
                  WebkitAppearance: 'menulist',
                  appearance: 'menulist'
                }}
                required
              >
                <option value="">Selecione</option>
                <option value="diesel">Diesel</option>
                <option value="gasolina">Gasolina</option>
                <option value="alcool">Álcool</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="quantidade_litros" className="block text-sm font-medium">
                Quantidade (L)*
              </label>
              <input
                type="number"
                id="quantidade_litros"
                name="quantidade_litros"
                value={formData.quantidade_litros}
                onChange={handleChange}
                step="0.01"
                className="w-full p-2 border rounded text-base"
                style={{ fontSize: '16px', minHeight: '42px' }}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="valor_litro" className="block text-sm font-medium">
                Valor por Litro (R$)*
              </label>
              <input
                type="number"
                id="valor_litro"
                name="valor_litro"
                value={formData.valor_litro}
                onChange={handleChange}
                step="0.01"
                className="w-full p-2 border rounded text-base"
                style={{ fontSize: '16px', minHeight: '42px' }}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="valor_total" className="block text-sm font-medium">
                Valor Total (R$)
              </label>
              <input
                type="number"
                id="valor_total"
                name="valor_total"
                value={formData.valor_total}
                readOnly
                className="w-full p-2 border rounded text-base bg-gray-50"
                style={{ fontSize: '16px', minHeight: '42px' }}
              />
            </div>
          </div>
        </div>
        
        {/* Observações */}
        <div className="space-y-2">
          <label htmlFor="observacoes" className="block text-sm font-medium">
            Observações
          </label>
          <textarea
            id="observacoes"
            name="observacoes"
            value={formData.observacoes}
            onChange={handleChange}
            className="w-full p-2 border rounded text-base"
            rows={3}
          />
        </div>
        
        {/* Botões */}
        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={() => {
              setFormData({
                placa: '',
                km: '',
                tipo_combustivel: '',
                quantidade_litros: '',
                valor_litro: '6.39',
                valor_total: '',
                projeto: '',
                motorista_nome: '',
                motorista_rg: '',
                operador: '',
                tipo_veiculo: 'frota',
                observacoes: ''
              });
            }}
            className="px-4 py-2 border rounded bg-gray-100 text-gray-700"
          >
            Limpar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Enviando...
              </>
            ) : "Registrar Abastecimento"}
          </button>
        </div>
      </form>
    </TabsContent>
  );
};

/**
 * Componente SimplifiedHistoricoAbastecimentos 
 * Versão simplificada do histórico para evitar problemas no DOM
 */
const SimplifiedHistoricoAbastecimentos: React.FC = () => {
  interface HistoricoItem {
    id: number;
    data_hora?: string;
    created_at?: string;
    placa: string;
    quantidade_litros?: number | string;
    litros?: number | string;
    valor_total?: number | string;
    projeto?: string;
  }

  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistorico = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/historico-direto/osasco_v2?t=${Date.now()}`);
        const data = await response.json();
        
        if (data.success) {
          setHistorico(data.data || []);
        } else {
          setError(data.message || 'Erro ao carregar histórico');
        }
      } catch (error) {
        console.error('Erro ao carregar histórico:', error);
        setError('Falha ao conectar com o servidor');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistorico();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchHistorico, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-md">
        <p className="font-medium">Erro ao carregar histórico</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data/Hora</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Placa</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Litros</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Projeto</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {historico.length > 0 ? (
            historico.slice(0, 10).map((item, index) => (
              <tr key={item.id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                  {item.data_hora || (item.created_at ? new Date(item.created_at).toLocaleString('pt-BR') : '-')}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">{item.placa || '-'}</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                  {typeof item.quantidade_litros === 'number' 
                    ? item.quantidade_litros.toFixed(2) 
                    : item.quantidade_litros || item.litros || '0.00'}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                  R$ {typeof item.valor_total === 'number' 
                    ? item.valor_total.toFixed(2) 
                    : item.valor_total || '0.00'}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                  {item.projeto || 'Não informado'}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="px-3 py-4 text-center text-sm text-gray-500">
                Nenhum registro encontrado
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Versão simplificada da página do posto Osasco V2
 * Esta versão substitui completamente a versão padrão para evitar problemas no DOM
 */
const OsascoV2Public: React.FC = () => {
  const { logout } = useAuth();
  
  const handleLogout = async () => {
    try {
      await logout();
      console.log('Logout realizado com sucesso');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 p-4">
      <button 
        onClick={handleLogout} 
        className="fixed top-4 right-4 bg-red-600 text-white px-3 py-2 rounded z-10"
      >
        Logout
      </button>
      
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 mt-12">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Posto {NOME_POSTO_OSASCO_V2}</h1>
          <p className="text-gray-600">
            Gerencie as operações do posto de combustível {NOME_POSTO_OSASCO_V2}
          </p>
        </div>
        
        {/* Formulários */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Operações</h2>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Registrar Operações</CardTitle>
              <CardDescription>
                Selecione o tipo de operação que deseja registrar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="abastecimento" className="w-full">
                <TabsList className="grid w-full grid-cols-1 md:grid-cols-3">
                  <TabsTrigger value="abastecimento" className="flex items-center gap-2">
                    <Fuel className="h-4 w-4" />
                    <span>Abastecimento</span>
                  </TabsTrigger>
                  <TabsTrigger value="recebimento" className="flex items-center gap-2">
                    <TruckIcon className="h-4 w-4" />
                    <span>Entrada de Combustível</span>
                  </TabsTrigger>
                  <TabsTrigger value="patio" className="flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    <span>Controle de Pátio</span>
                  </TabsTrigger>
                </TabsList>
                
                {/* Formulário simplificado para Osasco V2 */}
                <SimplifiedAbastecimentoForm />
                
                <TabsContent value="recebimento" className="mt-6">
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-yellow-800 text-center">
                      Formulário de recebimento de combustível em implementação.
                    </p>
                  </div>
                </TabsContent>
                
                <TabsContent value="patio" className="mt-6">
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-yellow-800 text-center">
                      Formulário de controle de pátio em implementação.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        {/* Históricos */}
        <div id="historicos-section">
          <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
            <History className="h-5 w-5" />
            Históricos
          </h2>
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Abastecimentos</CardTitle>
              <CardDescription>
                Últimos registros de abastecimentos realizados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SimplifiedHistoricoAbastecimentos />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OsascoV2Public;