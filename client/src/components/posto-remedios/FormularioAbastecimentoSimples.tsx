import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function FormularioAbastecimentoSimples() {
  const { toast } = useToast();
  const [form, setForm] = useState({
    placa: "",
    km: "",
    projeto: "",
    motorista_nome: "",
    motorista_rg: "",
    tipo_combustivel: "diesel",
    valor_litro: "",
    quantidade_litros: "",
    lavagem: false,
  });

  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  // Calcular valor total automaticamente
  const valorTotal = 
    form.valor_litro && form.quantidade_litros
      ? (parseFloat(form.valor_litro) * parseFloat(form.quantidade_litros)).toFixed(2)
      : "0.00";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setForm({ 
      ...form, 
      [name]: type === "checkbox" ? checked : value 
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Calcular valor total antes de enviar (mesmo se for calculado no frontend para display)
      const valorTotalCalculado = parseFloat(form.valor_litro) * parseFloat(form.quantidade_litros);
      
      const formData = {
        ...form,
        valor_total: isNaN(valorTotalCalculado) ? null : valorTotalCalculado
      };

      const response = await fetch('/api/posto-remedios/abastecimentos', {
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
          lavagem: false,
        });
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
    'USO OPERACIONAL'
  ];

  return (
    <div className="p-4 max-w-xl mx-auto bg-white rounded-xl shadow-md space-y-4">
      <h2 className="text-xl font-bold">Abastecimento - Posto Remédios</h2>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-3">
          <div>
            <label htmlFor="placa" className="block text-sm font-medium text-gray-700">Placa</label>
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
            <label htmlFor="km" className="block text-sm font-medium text-gray-700">Quilometragem (KM)</label>
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
            <label htmlFor="projeto" className="block text-sm font-medium text-gray-700">Projeto</label>
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
            <label htmlFor="motorista_nome" className="block text-sm font-medium text-gray-700">Nome do Motorista</label>
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
            <label htmlFor="motorista_rg" className="block text-sm font-medium text-gray-700">RG do Motorista</label>
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
        </div>
        
        <div className="border-t pt-3 mt-3">
          <h3 className="text-md font-medium mb-2">Dados do Abastecimento</h3>
          
          <div className="space-y-3">
            <div>
              <label htmlFor="tipo_combustivel" className="block text-sm font-medium text-gray-700">Tipo de Combustível</label>
              <select 
                id="tipo_combustivel"
                name="tipo_combustivel" 
                value={form.tipo_combustivel} 
                onChange={handleChange} 
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="diesel">Diesel</option>
                <option value="gasolina">Gasolina</option>
                <option value="alcool">Álcool</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="valor_litro" className="block text-sm font-medium text-gray-700">Valor por Litro (R$)</label>
              <input 
                id="valor_litro"
                name="valor_litro" 
                type="number" 
                step="0.01" 
                placeholder="Valor por litro" 
                value={form.valor_litro} 
                onChange={handleChange} 
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" 
              />
            </div>
            
            <div>
              <label htmlFor="quantidade_litros" className="block text-sm font-medium text-gray-700">Litros Abastecidos</label>
              <input 
                id="quantidade_litros"
                name="quantidade_litros" 
                type="number" 
                step="0.01" 
                placeholder="Quantidade de litros" 
                value={form.quantidade_litros} 
                onChange={handleChange} 
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Valor Total: R$ {valorTotal}</label>
              <p className="text-xs text-gray-500">Calculado automaticamente</p>
            </div>
          </div>
        </div>
        
        <div className="border-t pt-3 mt-3">
          <div className="flex items-center gap-2">
            <input 
              id="lavagem"
              type="checkbox" 
              name="lavagem" 
              checked={form.lavagem} 
              onChange={handleChange} 
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="lavagem" className="text-sm font-medium text-gray-700">
              Lavagem de Veículo
            </label>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? "Enviando..." : "Enviar Registro"}
        </button>
        
        {status && (
          <div className={`mt-2 p-2 text-sm text-center rounded ${status.includes('Erro') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {status}
          </div>
        )}
      </form>
    </div>
  );
}