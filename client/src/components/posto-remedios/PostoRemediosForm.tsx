import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

// Interface para o formulário
interface FormValues {
  placa: string;
  km: string;
  projeto: string;
  motorista_nome: string;
  motorista_rg: string;
  tipo_combustivel: string;
  valor_litro: string;
  quantidade_litros: string;
  valor_total: string;
  lavagem: boolean;
  tipo_lavagem: string;
  observacoes: string;
  tipo_veiculo: string;
}

export default function PostoRemediosForm() {
  const { toast } = useToast();
  const [form, setForm] = useState<FormValues>({
    placa: "",
    km: "",
    projeto: "",
    motorista_nome: "",
    motorista_rg: "",
    tipo_combustivel: "diesel",
    valor_litro: "",
    quantidade_litros: "",
    valor_total: "",
    lavagem: false,
    tipo_lavagem: "",
    observacoes: "",
    tipo_veiculo: "frota"
  });

  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  // Calcular valor total automaticamente
  const valorTotal = 
    form.valor_litro && form.quantidade_litros
      ? (parseFloat(form.valor_litro) * parseFloat(form.quantidade_litros)).toFixed(2)
      : "0.00";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setForm({ 
      ...form, 
      [name]: type === "checkbox" ? checked : value 
    });

    // Se for alterado valor_litro ou quantidade_litros, atualiza valor_total
    if ((name === 'valor_litro' || name === 'quantidade_litros') && form.valor_litro && form.quantidade_litros) {
      const vlrLitro = name === 'valor_litro' ? value : form.valor_litro;
      const qtdLitros = name === 'quantidade_litros' ? value : form.quantidade_litros;
      if (vlrLitro && qtdLitros) {
        const total = (parseFloat(vlrLitro) * parseFloat(qtdLitros)).toFixed(2);
        setForm(prevForm => ({ ...prevForm, valor_total: total }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Calcular valor total antes de enviar
      const valorTotalCalculado = parseFloat(form.valor_litro) * parseFloat(form.quantidade_litros);
      
      const formData = {
        ...form,
        valor_total: isNaN(valorTotalCalculado) ? null : valorTotalCalculado
      };

      const response = await fetch('/api/posto-remedios-standalone/abastecimentos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setStatus("Registro enviado com sucesso!");
        toast({
          title: "Sucesso",
          description: "Registro de abastecimento enviado com sucesso!",
        });
        
        // Limpar formulário
        setForm({
          placa: "",
          km: "",
          projeto: "",
          motorista_nome: "",
          motorista_rg: "",
          tipo_combustivel: "diesel",
          valor_litro: "",
          quantidade_litros: "",
          valor_total: "",
          lavagem: false,
          tipo_lavagem: "",
          observacoes: "",
          tipo_veiculo: "frota"
        });
        
        // Atualizar a tabela de histórico - Verifica se existe uma função global para isso
        if (window.location.pathname.includes('/posto-remedios')) {
          console.log("Atualizando histórico após cadastro bem-sucedido");
          
          // Se estivermos na página do posto remédios, vamos mudar para a aba de histórico
          const historicoTab = document.querySelector('[value="historico"]');
          if (historicoTab) {
            (historicoTab as HTMLElement).click();
          }
          
          // Acionar evento de atualização - isto irá recarregar os dados
          setTimeout(() => {
            const atualizarBtn = document.querySelector('button:has(.h-4.w-4.mr-2)');
            if (atualizarBtn) {
              console.log("Clicando no botão de atualizar automaticamente");
              (atualizarBtn as HTMLElement).click();
            }
          }, 500);
        }
      } else {
        const errorData = await response.json();
        setStatus(`Erro ao enviar: ${errorData.message || 'Falha ao registrar'}`);
        toast({
          title: "Erro",
          description: errorData.message || "Falha ao registrar o abastecimento",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
      setStatus("Erro ao enviar: Ocorreu um problema de conexão");
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar a solicitação",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Opções de projetos
  const projetosOptions = [
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
    'MANUTENÇÃO',
    'OPERACIONAL',
    'Outro'
  ];

  // Opções de tipos de combustível
  const combustiveisOptions = [
    { value: 'diesel', label: 'Diesel' },
    { value: 'gasolina', label: 'Gasolina' },
    { value: 'alcool', label: 'Álcool' }
  ];

  // Opções de tipos de lavagem
  const tiposLavagemOptions = [
    { value: 'completa', label: 'Lavagem Completa' },
    { value: 'simples', label: 'Lavagem Simples' },
    { value: 'interna', label: 'Lavagem Interna' }
  ];
  
  // Opções de tipos de veículo
  const tiposVeiculoOptions = [
    { value: 'frota', label: 'Frota' },
    { value: 'agregado', label: 'Agregado' }
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-xl shadow-lg space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Registro de Abastecimento - Posto Remédios</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Informações do Veículo */}
          <div className="col-span-1 md:col-span-2 lg:col-span-3">
            <h3 className="text-lg font-medium text-gray-700 mb-4 border-b pb-2">Informações do Veículo e Motorista</h3>
          </div>

          <div>
            <label htmlFor="tipo_veiculo" className="block text-sm font-medium text-gray-700 mb-1">Tipo de Veículo</label>
            <select 
              id="tipo_veiculo"
              name="tipo_veiculo" 
              value={form.tipo_veiculo} 
              onChange={handleChange} 
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              {tiposVeiculoOptions.map((tipo) => (
                <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="placa" className="block text-sm font-medium text-gray-700 mb-1">Placa</label>
            <input 
              id="placa"
              name="placa" 
              placeholder="Placa do veículo" 
              value={form.placa} 
              onChange={handleChange} 
              required 
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" 
            />
          </div>
          
          <div>
            <label htmlFor="km" className="block text-sm font-medium text-gray-700 mb-1">Quilometragem (KM)</label>
            <input 
              id="km"
              name="km" 
              type="number" 
              placeholder="KM atual do veículo" 
              value={form.km} 
              onChange={handleChange} 
              required 
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" 
            />
          </div>
          
          <div>
            <label htmlFor="projeto" className="block text-sm font-medium text-gray-700 mb-1">Projeto</label>
            <select 
              id="projeto"
              name="projeto" 
              value={form.projeto} 
              onChange={handleChange} 
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Selecione o projeto</option>
              {projetosOptions.map((projeto) => (
                <option key={projeto} value={projeto}>{projeto}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="motorista_nome" className="block text-sm font-medium text-gray-700 mb-1">Nome do Motorista</label>
            <input 
              id="motorista_nome"
              name="motorista_nome" 
              placeholder="Nome completo do motorista" 
              value={form.motorista_nome} 
              onChange={handleChange} 
              required 
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" 
            />
          </div>
          
          <div>
            <label htmlFor="motorista_rg" className="block text-sm font-medium text-gray-700 mb-1">RG do Motorista</label>
            <input 
              id="motorista_rg"
              name="motorista_rg" 
              placeholder="RG do motorista" 
              value={form.motorista_rg} 
              onChange={handleChange} 
              required 
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" 
            />
          </div>
          
          {/* Dados do Abastecimento */}
          <div className="col-span-1 md:col-span-2 lg:col-span-3 mt-4">
            <h3 className="text-lg font-medium text-gray-700 mb-4 border-b pb-2">Dados do Abastecimento</h3>
          </div>
          
          <div>
            <label htmlFor="tipo_combustivel" className="block text-sm font-medium text-gray-700 mb-1">Tipo de Combustível</label>
            <select 
              id="tipo_combustivel"
              name="tipo_combustivel" 
              value={form.tipo_combustivel} 
              onChange={handleChange} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              {combustiveisOptions.map((combustivel) => (
                <option key={combustivel.value} value={combustivel.value}>{combustivel.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="valor_litro" className="block text-sm font-medium text-gray-700 mb-1">Valor por Litro (R$)</label>
            <input 
              id="valor_litro"
              name="valor_litro" 
              type="number" 
              step="0.01" 
              placeholder="0.00" 
              value={form.valor_litro} 
              onChange={handleChange} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" 
            />
          </div>
          
          <div>
            <label htmlFor="quantidade_litros" className="block text-sm font-medium text-gray-700 mb-1">Litros Abastecidos</label>
            <input 
              id="quantidade_litros"
              name="quantidade_litros" 
              type="number" 
              step="0.01" 
              placeholder="0.00" 
              value={form.quantidade_litros} 
              onChange={handleChange} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" 
            />
          </div>
          
          <div>
            <label htmlFor="valor_total" className="block text-sm font-medium text-gray-700 mb-1">Valor Total (R$)</label>
            <input 
              id="valor_total"
              name="valor_total" 
              type="number" 
              step="0.01" 
              placeholder="0.00" 
              value={valorTotal} 
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 focus:outline-none focus:ring-primary-500 focus:border-primary-500" 
            />
            <p className="text-xs text-gray-500 mt-1">Calculado automaticamente</p>
          </div>
          
          {/* Dados da Lavagem */}
          <div className="col-span-1 md:col-span-2 lg:col-span-3 mt-4">
            <h3 className="text-lg font-medium text-gray-700 mb-4 border-b pb-2">Dados da Lavagem</h3>
            
            <div className="flex items-center mb-4">
              <input 
                id="lavagem"
                type="checkbox" 
                name="lavagem" 
                checked={form.lavagem} 
                onChange={handleChange} 
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="lavagem" className="ml-2 text-sm font-medium text-gray-700">
                Lavagem de Frota
              </label>
            </div>
          </div>
          
          {form.lavagem && (
            <>
              <div>
                <label htmlFor="tipo_lavagem" className="block text-sm font-medium text-gray-700 mb-1">Tipo de Lavagem</label>
                <select 
                  id="tipo_lavagem"
                  name="tipo_lavagem" 
                  value={form.tipo_lavagem} 
                  onChange={handleChange} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Selecione o tipo de lavagem</option>
                  {tiposLavagemOptions.map((tipo) => (
                    <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                  ))}
                </select>
              </div>
            </>
          )}
          
          <div className="col-span-1 md:col-span-2 lg:col-span-3">
            <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
            <textarea 
              id="observacoes"
              name="observacoes" 
              placeholder="Observações adicionais" 
              value={form.observacoes} 
              onChange={handleChange} 
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" 
            />
          </div>
        </div>

        <div className="mt-6">
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
          >
            {loading ? "Processando..." : "Registrar Abastecimento"}
          </button>
        </div>
        
        {status && (
          <div className={`mt-4 p-3 text-sm text-center rounded ${status.includes('Erro') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {status}
          </div>
        )}
      </form>
    </div>
  );
}