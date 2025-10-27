import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useFuelCardDraft } from "@/contexts/FuelCardDraftContext";
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
    const errorDetails: string[] = [];

    console.log(`🚀 [BOLSÃO] Iniciando envio em lote de ${total} solicitações`);

    for (let i = 0; i < draftRequests.length; i++) {
      const request = draftRequests[i];
      
      console.log(`📤 [BOLSÃO] Enviando ${i + 1}/${total} - Placa: ${request.placa}, Valor: ${request.valor_solicitado}`);
      
      try {
        const payload = {
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
        };

        console.log(`📦 [BOLSÃO] Payload da solicitação ${i + 1}:`, payload);

        const response = await fetch("/api/fuel-card-solicitations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        const responseData = await response.json();

        if (response.ok) {
          successCount++;
          console.log(`✅ [BOLSÃO] Solicitação ${i + 1} enviada com sucesso! ID: ${responseData.id || 'N/A'}`);
        } else {
          errorCount++;
          const errorMsg = `Placa ${request.placa}: ${responseData.message || 'Erro desconhecido'}`;
          errorDetails.push(errorMsg);
          console.error(`❌ [BOLSÃO] Erro na solicitação ${i + 1}:`, {
            placa: request.placa,
            status: response.status,
            erro: responseData.message,
            resposta_completa: responseData
          });
        }
      } catch (error) {
        errorCount++;
        const errorMsg = `Placa ${request.placa}: ${error instanceof Error ? error.message : 'Erro de rede'}`;
        errorDetails.push(errorMsg);
        console.error(`💥 [BOLSÃO] Exceção ao enviar solicitação ${i + 1}:`, {
          placa: request.placa,
          erro: error
        });
      }
      
      setSendingProgress(Math.round(((i + 1) / total) * 100));
    }

    console.log(`🏁 [BOLSÃO] Envio concluído - Sucesso: ${successCount}, Erros: ${errorCount}`);
    if (errorDetails.length > 0) {
      console.error(`📋 [BOLSÃO] Detalhes dos erros:`, errorDetails);
    }

    setIsSending(false);
    
    if (successCount > 0) {
      clearDraft();
      
      if (errorCount > 0) {
        toast({
          title: `✅ ${successCount} de ${total} solicitações enviadas com sucesso`,
          description: `⚠️ ${errorCount} solicitação(ões) apresentou erro. Verifique o console (F12) para detalhes dos erros.`,
          variant: "default",
          duration: 5000,
        });
      } else {
        toast({
          title: `🎉 Envio 100% concluído com sucesso!`,
          description: `✅ Todas as ${successCount} solicitações foram enviadas e registradas no sistema.`,
          duration: 4000,
        });
      }
      
      // Passar dados de resultado para a página de confirmação via sessionStorage
      // Captura a data_uso do primeiro item enviado com sucesso
      const firstSuccessfulRequest = draftRequests[0];
      sessionStorage.setItem('fuelCardConfirmation', JSON.stringify({
        successCount,
        errorCount,
        total,
        errorDetails: errorDetails.length > 0 ? errorDetails : undefined,
        data_uso: firstSuccessfulRequest?.data_uso
      }));
      
      setTimeout(() => {
        setLocation("/fuel-card/confirmation");
      }, 1500);
    } else {
      toast({
        title: "❌ Erro total no envio",
        description: `Nenhuma das ${total} solicitação(ões) foi enviada. Detalhes: ${errorDetails.slice(0, 2).join('; ')}${errorDetails.length > 2 ? '...' : ''}`,
        variant: "destructive",
        duration: 6000,
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
                  {draftRequests.map((request, index) => {
                    const isDuplicate = duplicates.includes(request.id);
                    return (
                      <div
                        key={request.id}
                        className={`p-4 border rounded-lg ${
                          isDuplicate 
                            ? 'border-red-300 bg-red-50' 
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-3 mb-3">
                              <Badge variant="outline">#{index + 1}</Badge>
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600 text-sm font-medium">🚗 Placa do Carro:</span>
                                <span 
                                  className={`font-bold text-xl ${
                                    isDuplicate ? 'text-red-600' : 'text-gray-900'
                                  }`}
                                >
                                  {request.placa}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600 text-sm font-medium">💳 Placa do Cartão:</span>
                                <span 
                                  className={`font-bold text-xl ${
                                    isDuplicate ? 'text-red-600' : 'text-blue-700'
                                  }`}
                                >
                                  {request.tipo_cartao === "numero" && request.numero_cartao 
                                    ? request.numero_cartao 
                                    : request.placa}
                                </span>
                              </div>
                              {isDuplicate && (
                                <Badge variant="destructive">Duplicata Detectada</Badge>
                              )}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                              <div>
                                <span className="text-gray-500 block mb-1">Motorista:</span>
                                <p className="font-medium">{request.motorista}</p>
                              </div>
                              <div>
                                <span className="text-gray-500 block mb-1">KM:</span>
                                <p className="font-medium">{request.km.toLocaleString()}</p>
                              </div>
                              <div>
                                <span className="text-gray-500 block mb-1">Valor:</span>
                                <p className="font-medium text-green-600">{formatCurrency(request.valor_solicitado)}</p>
                              </div>
                              <div>
                                <span className="text-gray-500 block mb-1">Data Uso:</span>
                                <p className="font-medium">{request.data_uso ? new Date(request.data_uso + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}</p>
                              </div>
                              <div>
                                <span className="text-gray-500 block mb-1">🕐 Turno:</span>
                                <p className="font-bold text-orange-600">{request.turno || '-'}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 pt-3 border-t text-sm">
                              <div>
                                <span className="text-gray-500 block mb-1">⛽ Tipo de Combustível:</span>
                                <p className="font-semibold text-blue-700">{request.tipo_combustivel || 'Não especificado'}</p>
                              </div>
                              <div>
                                <span className="text-gray-500 block mb-1">💳 Provedor do Cartão:</span>
                                <p className="font-semibold text-purple-700">{request.provedor_cartao || 'Não especificado'}</p>
                              </div>
                              <div>
                                <span className="text-gray-500 block mb-1">📍 Base:</span>
                                <p className="font-semibold text-indigo-700">{request.base || 'Não especificada'}</p>
                              </div>
                            </div>
                            {request.observacoes && (
                              <p className="text-sm text-gray-600 mt-3 italic border-t pt-2">{request.observacoes}</p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemove(request.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-2"
                            data-testid={`button-remove-${request.id}`}
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Resumo e ações */}
                <div className="border-t pt-4 space-y-4">
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Total Geral:</span>
                    <span className="text-green-600">{formatCurrency(totalValue)}</span>
                  </div>

                  {isSending && (
                    <Alert className="bg-blue-50 border-blue-200">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      <AlertDescription className="text-blue-800 font-medium">
                        📤 Enviando {Math.round((sendingProgress / 100) * draftRequests.length)} de {draftRequests.length} solicitações... ({sendingProgress}%)
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
        
        {/* Rodapé */}
        <div className="mt-6 text-center text-sm text-gray-500">
          Desenvolvido por Carpe Diem 4004 | suporte 11 970558053 | Sistema v2.9.4
        </div>
      </div>
    </div>
  );
}
