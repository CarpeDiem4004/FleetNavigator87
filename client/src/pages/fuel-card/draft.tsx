import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useFuelCardDraft } from "@/hooks/useFuelCardDraft";
import { 
  ShoppingCart, 
  Trash2, 
  Send, 
  ArrowLeft, 
  AlertTriangle,
  CheckCircle2,
  Loader2 
} from "lucide-react";

export default function FuelCardDraft() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { draftRequests, draftCount, removeFromDraft, clearDraft, getDuplicates } = useFuelCardDraft();
  const [isSending, setIsSending] = useState(false);
  const [sendingProgress, setSendingProgress] = useState(0);
  
  const duplicates = getDuplicates();

  const handleRemove = (id: string) => {
    removeFromDraft(id);
    toast({
      title: "Removido",
      description: "Solicitação removida do bolsão",
    });
  };

  const handleSendAll = async () => {
    if (draftRequests.length === 0) {
      toast({
        title: "Bolsão vazio",
        description: "Adicione solicitações antes de enviar",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    setSendingProgress(0);
    
    let successCount = 0;
    let errorCount = 0;
    const total = draftRequests.length;

    for (let i = 0; i < draftRequests.length; i++) {
      const request = draftRequests[i];
      
      try {
        const response = await fetch("/api/fuel-card-solicitations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            placa: request.placa,
            km: request.km,
            valor_solicitado: request.valor_solicitado,
            tipo_cartao: request.tipo_cartao,
            provedor_cartao: request.provedor_cartao,
            numero_cartao: request.numero_cartao,
            tipo_combustivel: request.tipo_combustivel,
            motorista: request.motorista,
            solicitante: request.solicitante,
            telefone_celular: request.telefone_celular,
            base: request.base,
            id_rota: request.id_rota,
            observacoes: request.observacoes,
            projeto_id: request.projeto_id,
            base_id: request.base_id,
            data_uso: request.data_uso,
            turno: request.turno
          })
        });

        if (response.ok) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        console.error("Erro ao enviar solicitação:", error);
        errorCount++;
      }
      
      setSendingProgress(Math.round(((i + 1) / total) * 100));
    }

    setIsSending(false);
    
    if (successCount > 0) {
      clearDraft();
      toast({
        title: "Envio concluído",
        description: `${successCount} solicitações enviadas com sucesso${errorCount > 0 ? ` (${errorCount} com erro)` : ''}`,
      });
      
      setTimeout(() => setLocation("/fuel-card/confirmation"), 1500);
    } else {
      toast({
        title: "Erro no envio",
        description: "Não foi possível enviar as solicitações",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const totalValue = draftRequests.reduce((sum, req) => sum + req.valor_solicitado, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-6">
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShoppingCart className="h-8 w-8 text-blue-600" />
                <div>
                  <CardTitle className="text-2xl">Bolsão de Solicitações</CardTitle>
                  <CardDescription>
                    Revise todas as solicitações antes de enviar
                  </CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="text-lg px-4 py-2">
                {draftCount} {draftCount === 1 ? 'item' : 'itens'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {/* Alerta de duplicatas */}
            {duplicates.length > 0 && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Atenção! Foram detectadas {duplicates.length} possíveis duplicatas (mesmo veículo, data e valor).
                  Revise antes de enviar.
                </AlertDescription>
              </Alert>
            )}

            {/* Lista de solicitações */}
            {draftRequests.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">Nenhuma solicitação no bolsão</p>
                <Button onClick={() => setLocation("/fuel-card/solicitation")}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar ao Formulário
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-6">
                  {draftRequests.map((request, index) => (
                    <div
                      key={request.id}
                      className={`p-4 border rounded-lg ${
                        duplicates.includes(request.id) 
                          ? 'border-red-300 bg-red-50' 
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">#{index + 1}</Badge>
                            <span className="font-semibold text-lg">{request.placa}</span>
                            {duplicates.includes(request.id) && (
                              <Badge variant="destructive">Possível Duplicata</Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                            <div>
                              <span className="text-gray-500">Motorista:</span>
                              <p className="font-medium">{request.motorista}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">KM:</span>
                              <p className="font-medium">{request.km.toLocaleString()}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Valor:</span>
                              <p className="font-medium text-green-600">{formatCurrency(request.valor_solicitado)}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Data Uso:</span>
                              <p className="font-medium">{request.data_uso ? new Date(request.data_uso + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}</p>
                            </div>
                          </div>
                          {request.observacoes && (
                            <p className="text-sm text-gray-600 mt-2 italic">{request.observacoes}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemove(request.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Resumo e ações */}
                <div className="border-t pt-4 space-y-4">
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Total Geral:</span>
                    <span className="text-green-600">{formatCurrency(totalValue)}</span>
                  </div>

                  {isSending && (
                    <Alert>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <AlertDescription>
                        Enviando solicitações... {sendingProgress}%
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setLocation("/fuel-card/solicitation")}
                      disabled={isSending}
                      className="flex-1"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Adicionar Mais
                    </Button>
                    
                    <Button
                      variant="destructive"
                      onClick={() => {
                        if (confirm("Deseja realmente limpar todo o bolsão?")) {
                          clearDraft();
                          toast({
                            title: "Bolsão limpo",
                            description: "Todas as solicitações foram removidas",
                          });
                        }
                      }}
                      disabled={isSending}
                      className="flex-1"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Limpar Tudo
                    </Button>
                    
                    <Button
                      onClick={handleSendAll}
                      disabled={isSending}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    >
                      {isSending ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-5 w-5" />
                          Enviar Todas ({draftCount})
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
