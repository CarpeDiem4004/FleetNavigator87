import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

// Interface para o formulário de lavagem apenas
interface FormValues {
  placa: string;
  km: string;
  projeto: string;
  motorista_nome: string;
  motorista_rg: string;
  tipo_lavagem: string;
  observacoes: string;
  tipo_veiculo: string;
}

export default function PostoRemediosLavagemForm() {
  const { toast } = useToast();
  const [form, setForm] = useState<FormValues>({
    placa: "",
    km: "",
    projeto: "",
    motorista_nome: "",
    motorista_rg: "",
    tipo_lavagem: "",
    observacoes: "",
    tipo_veiculo: "frota"
  });

  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setStatus("");

    // Validação dos campos obrigatórios
    if (!form.placa || !form.km || !form.projeto || !form.motorista_nome || !form.motorista_rg || !form.tipo_lavagem) {
      setStatus("Por favor, preencha todos os campos obrigatórios.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/posto-remedios/lavagem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          lavagem: true, // Sempre true para este formulário
          km: parseInt(form.km),
        }),
      });

      if (response.ok) {
        setStatus("Lavagem registrada com sucesso!");
        toast({
          title: "Sucesso!",
          description: "Lavagem registrada com sucesso!",
        });
        
        // Reset do formulário
        setForm({
          placa: "",
          km: "",
          projeto: "",
          motorista_nome: "",
          motorista_rg: "",
          tipo_lavagem: "",
          observacoes: "",
          tipo_veiculo: "frota"
        });
      } else {
        const errorData = await response.json();
        setStatus(`Erro: ${errorData.message || "Erro ao registrar lavagem"}`);
        toast({
          title: "Erro",
          description: errorData.message || "Erro ao registrar lavagem",
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
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center text-blue-800">
        Registro de Lavagem - Posto Remédios
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Informações do Veículo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>

        {/* Projeto e Tipo de Veículo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="projeto" className="block text-sm font-medium text-gray-700">
              Projeto *
            </label>
            <input
              type="text"
              id="projeto"
              name="projeto"
              value={form.projeto}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Nome do projeto"
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

        {/* Informações do Motorista */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>

        {/* Tipo de Lavagem */}
        <div>
          <label htmlFor="tipo_lavagem" className="block text-sm font-medium text-gray-700">
            Tipo de Lavagem *
          </label>
          <select
            id="tipo_lavagem"
            name="tipo_lavagem"
            value={form.tipo_lavagem}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Selecione o tipo de lavagem</option>
            <option value="simples">Lavagem Simples</option>
            <option value="completa">Lavagem Completa</option>
            <option value="enceramento">Lavagem + Enceramento</option>
          </select>
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
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Registrando..." : "Registrar Lavagem"}
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