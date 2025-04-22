import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import AppLayout from "@/components/layout/AppLayout";

interface FuelCardRequest {
  id: number;
  placa: string;
  motorista: string;
  valor_solicitado: number;
  status: string;
  observacoes?: string;
  data_solicitacao: string;
}

export default function FuelCard() {
  const [solicitacoes, setSolicitacoes] = useState<FuelCardRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await apiRequest("GET", "/api/fuel-card-solicitations");
        const data = await response.json();
        
        if (data.success) {
          setSolicitacoes(data.data);
        } else {
          setError(data.message || "Erro ao carregar solicitações");
        }
      } catch (err) {
        console.error("Erro ao buscar solicitações:", err);
        setError("Falha ao conectar ao servidor");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Solicitações de Fuel Card</h1>
        
        {loading && (
          <div className="flex justify-center my-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>{error}</p>
          </div>
        )}
        
        {!loading && !error && solicitacoes.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
            <p>Nenhuma solicitação encontrada.</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {solicitacoes.map((sfc) => (
            <div 
              key={sfc.id} 
              className="border border-gray-200 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow bg-white"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg">{sfc.placa}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  sfc.status === "Aprovado" ? "bg-green-100 text-green-800" :
                  sfc.status === "Pendente" ? "bg-yellow-100 text-yellow-800" :
                  sfc.status === "Rejeitado" ? "bg-red-100 text-red-800" :
                  "bg-gray-100 text-gray-800"
                }`}>
                  {sfc.status}
                </span>
              </div>
              <div className="space-y-1 text-gray-700">
                <p><span className="font-medium">Motorista:</span> {sfc.motorista}</p>
                <p><span className="font-medium">Valor:</span> R$ {sfc.valor_solicitado.toFixed(2).replace('.', ',')}</p>
                <p><span className="font-medium">Data:</span> {new Date(sfc.data_solicitacao).toLocaleDateString('pt-BR')}</p>
                {sfc.observacoes && (
                  <p><span className="font-medium">Observações:</span> {sfc.observacoes}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}