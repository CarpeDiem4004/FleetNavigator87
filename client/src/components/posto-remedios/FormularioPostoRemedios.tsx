import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

// Interface para o formulário completo
interface FormValues {
  placa: string;
  km: string;
  projeto: string;
  motorista_nome: string;
  motorista_rg: string;
  tipo_combustivel: string;
  valor_litro: string;
  quantidade_litros: string;
  lavagem: boolean;
  tipo_lavagem: string;
  observacoes: string;
  tipo_veiculo: string;
  apenas_lavagem: boolean; // Nova opção para registrar apenas lavagem
}

export default function FormularioPostoRemedios() {
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
    lavagem: false,
    tipo_lavagem: "",
    observacoes: "",
    tipo_veiculo: "frota",
    apenas_lavagem: false
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
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setStatus("");

    // Validação dos campos obrigatórios
    if (!form.placa || !form.km || !form.projeto || !form.motorista_nome || !form.motorista_rg) {
      setStatus("Por favor, preencha todos os campos obrigatórios.");
      setLoading(false);
      return;
    }

    // Verificar se é abastecimento ou lavagem
    const isAbastecimento = form.quantidade_litros && parseFloat(form.quantidade_litros) > 0;
    const isLavagem = form.lavagem || form.apenas_lavagem;

    // Se é "apenas lavagem", forçar lavagem como true
    if (form.apenas_lavagem) {
      form.lavagem = true;
    }

    // Deve ser pelo menos abastecimento ou lavagem
    if (!isAbastecimento && !isLavagem) {
      setStatus("Preencha os dados de abastecimento ou marque a opção de lavagem.");
      setLoading(false);
      return;
    }

    // Se NÃO é apenas lavagem e tem abastecimento, validar campos obrigatórios
    if (!form.apenas_lavagem && isAbastecimento && (!form.valor_litro || parseFloat(form.valor_litro) <= 0)) {
      setStatus("Para abastecimento, preencha o valor por litro.");
      setLoading(false);
      return;
    }

    // Se é lavagem, deve ter tipo de lavagem
    if (isLavagem && !form.tipo_lavagem) {
      setStatus("Para lavagem, selecione o tipo de lavagem.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/posto-remedios-standalone/abastecimentos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          km: parseInt(form.km),
          quantidade_litros: form.quantidade_litros ? parseFloat(form.quantidade_litros) : null,
          valor_litro: form.valor_litro ? parseFloat(form.valor_litro) : null,
          valor_total: valorTotal ? parseFloat(valorTotal) : null,
        }),
      });

      if (response.ok) {
        const tipoRegistro = form.lavagem ? "lavagem" : "abastecimento";
        setStatus(`${tipoRegistro.charAt(0).toUpperCase() + tipoRegistro.slice(1)} registrado com sucesso!`);
        toast({
          title: "Sucesso!",
          description: `${tipoRegistro.charAt(0).toUpperCase() + tipoRegistro.slice(1)} registrado com sucesso!`,
        });
        
        // Reset do formulário
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
          tipo_lavagem: "",
          observacoes: "",
          tipo_veiculo: "frota",
          apenas_lavagem: false
        });
      } else {
        const errorData = await response.json();
        setStatus(`Erro: ${errorData.message || "Erro ao registrar"}`);
        toast({
          title: "Erro",
          description: errorData.message || "Erro ao registrar",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao enviar formulário:", error);
      setStatus("Erro ao enviar formulário. Tente novamente.");
      toast({
        title: "Erro",
        description: "Erro ao enviar formulário. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center text-blue-800">
        Registro de Abastecimento e Lavagem - Posto Remédios
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações do Veículo */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Informações do Veículo</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="placa" className="block text-sm font-medium text-gray-700">
                Placa do Veículo *
              </label>
              <input
                type="text"
                id="placa"
                name="placa"
                value={form.placa}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="ABC-1234"
                required
              />
            </div>

            <div>
              <label htmlFor="km" className="block text-sm font-medium text-gray-700">
                KM Atual *
              </label>
              <input
                type="number"
                id="km"
                name="km"
                value={form.km}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="120000"
                required
              />
            </div>

            <div>
              <label htmlFor="tipo_veiculo" className="block text-sm font-medium text-gray-700">
                Tipo de Veículo
              </label>
              <select
                id="tipo_veiculo"
                name="tipo_veiculo"
                value={form.tipo_veiculo}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="frota">Frota</option>
                <option value="terceiro">Terceiro</option>
              </select>
            </div>
          </div>
        </div>

        {/* Informações do Motorista */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Informações do Motorista</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="motorista_nome" className="block text-sm font-medium text-gray-700">
                Nome do Motorista *
              </label>
              <input
                type="text"
                id="motorista_nome"
                name="motorista_nome"
                value={form.motorista_nome}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nome completo"
                required
              />
            </div>

            <div>
              <label htmlFor="motorista_rg" className="block text-sm font-medium text-gray-700">
                RG do Motorista *
              </label>
              <input
                type="text"
                id="motorista_rg"
                name="motorista_rg"
                value={form.motorista_rg}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="12.345.678-9"
                required
              />
            </div>

            <div>
              <label htmlFor="projeto" className="block text-sm font-medium text-gray-700">
                Projeto *
              </label>
              <select
                id="projeto"
                name="projeto"
                value={form.projeto}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Selecione o projeto</option>
                <option value="COCA COLA">COCA COLA</option>
                <option value="FULL MELI">FULL MELI</option>
                <option value="GRUPO PEREIRA">GRUPO PEREIRA</option>
                <option value="MADEIRA MADEIRA">MADEIRA MADEIRA</option>
                <option value="MAGALU">MAGALU</option>
                <option value="MANUTENÇÃO">MANUTENÇÃO</option>
                <option value="MERCADO LIVRE">MERCADO LIVRE</option>
                <option value="NATURA">NATURA</option>
                <option value="OPERACIONAL">OPERACIONAL</option>
                <option value="OXXO">OXXO</option>
                <option value="PETLOVE">PETLOVE</option>
                <option value="SHOPEE">SHOPEE</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tipo de Serviço */}
        <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
          <h3 className="text-lg font-semibold mb-4 text-purple-800">Tipo de Serviço</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="apenas_lavagem"
                name="apenas_lavagem"
                checked={form.apenas_lavagem}
                onChange={handleChange}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="apenas_lavagem" className="text-sm font-medium text-gray-700">
                Registrar APENAS Lavagem (sem abastecimento)
              </label>
            </div>
            {form.apenas_lavagem && (
              <div className="bg-purple-100 p-3 rounded-md">
                <p className="text-sm text-purple-700">
                  ⚠️ Quando marcado, apenas a lavagem será registrada. Os campos de combustível ficarão opcionais.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Abastecimento */}
        <div className={`p-4 rounded-lg ${form.apenas_lavagem ? 'bg-gray-50 opacity-75' : 'bg-blue-50'}`}>
          <h3 className="text-lg font-semibold mb-4 text-blue-800">Abastecimento</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="tipo_combustivel" className="block text-sm font-medium text-gray-700">
                Tipo de Combustível {form.apenas_lavagem && <span className="text-gray-500">(Desabilitado)</span>}
              </label>
              <select
                id="tipo_combustivel"
                name="tipo_combustivel"
                value={form.tipo_combustivel}
                onChange={handleChange}
                disabled={form.apenas_lavagem}
                className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${form.apenas_lavagem ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              >
                <option value="diesel">Diesel</option>
                <option value="gasolina">Gasolina</option>
                <option value="alcool">Álcool</option>
              </select>
            </div>

            <div>
              <label htmlFor="quantidade_litros" className="block text-sm font-medium text-gray-700">
                Quantidade (Litros) {form.apenas_lavagem && <span className="text-gray-500">(Desabilitado)</span>}
              </label>
              <input
                type="number"
                step="0.01"
                id="quantidade_litros"
                name="quantidade_litros"
                value={form.quantidade_litros}
                onChange={handleChange}
                disabled={form.apenas_lavagem}
                className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${form.apenas_lavagem ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                placeholder="0.00"
              />
            </div>

            <div>
              <label htmlFor="valor_litro" className="block text-sm font-medium text-gray-700">
                Valor por Litro (R$) {form.apenas_lavagem && <span className="text-gray-500">(Desabilitado)</span>}
              </label>
              <input
                type="number"
                step="0.001"
                id="valor_litro"
                name="valor_litro"
                value={form.valor_litro}
                onChange={handleChange}
                disabled={form.apenas_lavagem}
                className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${form.apenas_lavagem ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                placeholder="0.000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Valor Total (R$)
              </label>
              <input
                type="text"
                value={`R$ ${valorTotal}`}
                readOnly
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-600"
              />
            </div>
          </div>
        </div>

        {/* Lavagem */}
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-green-800">Lavagem</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="lavagem"
                name="lavagem"
                checked={form.lavagem}
                onChange={handleChange}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="lavagem" className="ml-2 block text-sm font-medium text-gray-700">
                Realizar Lavagem
              </label>
            </div>

            {form.lavagem && (
              <div>
                <label htmlFor="tipo_lavagem" className="block text-sm font-medium text-gray-700">
                  Tipo de Lavagem *
                </label>
                <select
                  id="tipo_lavagem"
                  name="tipo_lavagem"
                  value={form.tipo_lavagem}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  required={form.lavagem}
                >
                  <option value="">Selecione o tipo de lavagem</option>
                  <option value="simples">Lavagem Simples</option>
                  <option value="completa">Lavagem Completa</option>
                  <option value="enceramento">Lavagem + Enceramento</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Observações */}
        <div>
          <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700">
            Observações
          </label>
          <textarea
            id="observacoes"
            name="observacoes"
            value={form.observacoes}
            onChange={handleChange}
            rows={3}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Observações adicionais (opcional)"
          />
        </div>

        {/* Botão de Submissão */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold"
          >
            {loading ? "Registrando..." : "Registrar"}
          </button>
        </div>

        {/* Status */}
        {status && (
          <div className={`mt-4 p-3 rounded ${
            status.includes("sucesso") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}>
            {status}
          </div>
        )}
      </form>
    </div>
  );
}