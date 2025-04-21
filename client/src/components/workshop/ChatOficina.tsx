import { useEffect, useState } from 'react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQuery } from '@tanstack/react-query';
import { Loader2, SendIcon, CheckCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatCurrency } from '@/lib/utils';

interface Message {
  id: number;
  author: 'oficina' | 'gestor_frota';
  authorName: string;
  message: string;
  proposedBudget: number | null;
  sent_at: string;
}

interface ChatData {
  id: number;
  maintenanceId: number;
  initialBudget: number | null;
  finalBudget: number | null;
  kmAtual: string | null;
  prazoEstimado: string | null;
  descricaoServico: string | null;
  isFinalized: boolean;
  messages: Message[];
}

interface ChatOficinaProps {
  maintenanceId: number;
  initialBudget?: string | null; // Alterado para receber string
  kmAtual?: string | null;
  prazoEstimado?: string | null;
  descricaoServico?: string | null;
  chatId?: number | null;
}

export default function ChatOficina({ 
  maintenanceId, 
  initialBudget, 
  kmAtual, 
  prazoEstimado, 
  descricaoServico, 
  chatId: externalChatId 
}: ChatOficinaProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [proposedBudget, setProposedBudget] = useState<string>('');
  const [chatId, setChatId] = useState<number | null>(externalChatId || null);

  // Buscar ou criar chat
  const {
    data: chat,
    isLoading: chatLoading,
    error: chatError,
    refetch: refetchChat
  } = useQuery({
    queryKey: ['/api/workshop/maintenance-chat', maintenanceId],
    queryFn: async () => {
      const res = await apiRequest(
        'GET',
        `/api/workshop/maintenance-chat/${maintenanceId}`
      );
      const data = await res.json();
      
      if (data.id) {
        setChatId(data.id);
      }
      
      return data;
    }
  });

  // Iniciar chat se não existir e tiver orçamento inicial
  const initChatMutation = useMutation({
    mutationFn: async () => {
      if (!initialBudget) return null;
      
      const res = await apiRequest(
        'POST',
        '/api/workshop/maintenance-chat',
        {
          maintenanceId,
          initialBudget: initialBudget.toString(), // Já está convertendo para string
          kmAtual: kmAtual || '',
          prazoEstimado: prazoEstimado || '',
          descricaoServico: descricaoServico || ''
        }
      );
      
      return await res.json();
    },
    onSuccess: (data) => {
      if (data && data.id) {
        setChatId(data.id);
        refetchChat();
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao iniciar negociação',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Enviar mensagem
  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      if (!chatId) return null;
      
      const messageData: any = {
        chatId,
        message
      };
      
      if (proposedBudget && !isNaN(parseFloat(proposedBudget))) {
        messageData.proposedBudget = parseFloat(proposedBudget);
      }
      
      const res = await apiRequest(
        'POST',
        '/api/workshop/chat-message',
        messageData
      );
      
      return await res.json();
    },
    onSuccess: () => {
      setMessage('');
      setProposedBudget('');
      refetchChat();
      
      // Invalidar cache da consulta de manutenções
      queryClient.invalidateQueries({ queryKey: ['/api/workshop/maintenance'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao enviar mensagem',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Finalizar a negociação
  const finalizeChatMutation = useMutation({
    mutationFn: async (finalBudget: number) => {
      if (!chatId) return null;
      
      const res = await apiRequest(
        'POST',
        `/api/workshop/maintenance-chat/${chatId}/finalize`,
        { finalBudget }
      );
      
      return await res.json();
    },
    onSuccess: () => {
      refetchChat();
      
      toast({
        title: 'Negociação finalizada',
        description: 'O orçamento foi aprovado e a manutenção pode prosseguir.',
      });
      
      // Invalidar cache da consulta de manutenções
      queryClient.invalidateQueries({ queryKey: ['/api/workshop/maintenance'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao finalizar negociação',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Verificar se precisa criar o chat
  useEffect(() => {
    if (!chatLoading && !chat?.id && initialBudget && !chatError) {
      initChatMutation.mutate();
    }
  }, [chatLoading, chat, initialBudget, chatError]);
  
  // Atualizar chatId quando externalChatId mudar
  useEffect(() => {
    if (externalChatId) {
      setChatId(externalChatId);
      refetchChat();
    }
  }, [externalChatId]);

  // Função para formatar hora da mensagem
  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Classes de estilo para mensagens
  const getMessageClass = (author: string) => {
    return author === 'oficina'
      ? 'bg-blue-100 dark:bg-blue-900 ml-auto'
      : 'bg-gray-100 dark:bg-gray-800 mr-auto';
  };

  const handleSendMessage = () => {
    if ((!message.trim() && !proposedBudget) || !chatId) return;
    sendMessageMutation.mutate();
  };

  if (chatLoading) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-2">Carregando chat...</p>
        </CardContent>
      </Card>
    );
  }

  if (chatError) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6 text-center text-red-500">
          <p>Erro ao carregar o chat. Tente novamente mais tarde.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-bold flex items-center">
          Chat de Negociação {chat?.isFinalized && (
            <Badge variant="outline" className="ml-2 bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" /> Finalizado
            </Badge>
          )}
        </CardTitle>
        <CardDescription className="space-y-2">
          {chat?.initialBudget ? (
            <>
              <div className="font-medium">
                Orçamento Inicial: {formatCurrency(chat.initialBudget)}
                {chat?.finalBudget && ` → Final: ${formatCurrency(chat.finalBudget)}`}
              </div>
              
              {(chat.kmAtual || chat.prazoEstimado || chat.descricaoServico) && (
                <div className="text-sm grid gap-2 mt-2 p-2 bg-muted/50 rounded-md">
                  {chat.kmAtual && (
                    <div>
                      <span className="font-semibold">Quilometragem Atual:</span> {chat.kmAtual} km
                    </div>
                  )}
                  
                  {chat.prazoEstimado && (
                    <div>
                      <span className="font-semibold">Prazo Estimado:</span> {chat.prazoEstimado} dias
                    </div>
                  )}
                  
                  {chat.descricaoServico && (
                    <div>
                      <span className="font-semibold">Descrição do Serviço:</span> {chat.descricaoServico}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : 'Informe um orçamento inicial para iniciar a negociação'}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <ScrollArea className="h-[300px] pr-4 mb-4 border rounded-md p-2">
          {chat?.messages && chat.messages.length > 0 ? (
            <div className="space-y-3">
              {chat.messages.map((msg: Message) => (
                <div 
                  key={msg.id} 
                  className={`p-3 rounded-lg max-w-[80%] ${getMessageClass(msg.author)}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-sm">
                      {msg.author === 'oficina' ? 'Oficina' : 'Gestor de Frota'}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {formatMessageTime(msg.sent_at)}
                    </span>
                  </div>
                  
                  {msg.proposedBudget && (
                    <div className="mb-2">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Orçamento proposto: {formatCurrency(msg.proposedBudget)}
                      </Badge>
                    </div>
                  )}
                  
                  <p className="text-sm">{msg.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              {chat?.id ? 'Nenhuma mensagem enviada ainda' : 'Inicie o chat enviando um orçamento'}
            </div>
          )}
        </ScrollArea>
        
        {!chat?.isFinalized && (
          <div className="space-y-3">
            <div>
              <Label htmlFor="proposedBudget">Orçamento proposto (opcional)</Label>
              <Input
                id="proposedBudget"
                type="number"
                step="0.01"
                min="0"
                value={proposedBudget}
                onChange={(e) => setProposedBudget(e.target.value)}
                placeholder="Digite o valor proposto (R$)"
              />
            </div>
            
            <div>
              <Label htmlFor="message">Mensagem</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Digite sua mensagem"
                rows={3}
              />
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        {/* Botões de finalização (visíveis apenas em negociação) */}
        {!chat?.isFinalized && chat?.messages && chat.messages.length > 0 && user?.role === 'gestor_frota' && (
          <div>
            <Button 
              variant="outline" 
              className="bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 border-green-200"
              onClick={() => {
                // Usa o último orçamento proposto como final, ou o inicial se nenhum foi proposto
                const lastProposedBudget = [...chat.messages]
                  .reverse()
                  .find(msg => msg.proposedBudget)?.proposedBudget;
                
                const finalBudget = lastProposedBudget || chat.initialBudget;
                
                if (finalBudget) {
                  finalizeChatMutation.mutate(finalBudget);
                }
              }}
              disabled={finalizeChatMutation.isPending}
            >
              {finalizeChatMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Aprovar Orçamento
            </Button>
          </div>
        )}
        
        {/* Botão de envio (visível apenas se o chat não estiver finalizado) */}
        {!chat?.isFinalized && (
          <Button 
            onClick={handleSendMessage}
            disabled={sendMessageMutation.isPending || (!message.trim() && !proposedBudget) || !chatId}
          >
            {sendMessageMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <SendIcon className="h-4 w-4 mr-2" />
            )}
            Enviar
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}