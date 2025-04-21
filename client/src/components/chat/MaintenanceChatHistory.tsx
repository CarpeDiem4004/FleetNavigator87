import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";
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
  isFinalized: boolean;
  messages: Message[];
}

interface MaintenanceChatHistoryProps {
  maintenanceId: number;
}

export default function MaintenanceChatHistory({ maintenanceId }: MaintenanceChatHistoryProps) {
  const { user } = useAuth();

  // Buscar histórico de chat
  const {
    data: chat,
    isLoading,
    error
  } = useQuery({
    queryKey: ['/api/workshop/maintenance-chat', maintenanceId],
    queryFn: async () => {
      const res = await apiRequest(
        'GET',
        `/api/workshop/maintenance-chat/${maintenanceId}`
      );
      return await res.json();
    },
    enabled: !!maintenanceId,
  });

  // Função para formatar data/hora da mensagem
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

  if (isLoading) {
    return (
      <Card className="mb-4">
        <CardHeader className="py-2">
          <CardTitle className="text-lg">Histórico de Negociação</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground">
          Carregando histórico...
        </CardContent>
      </Card>
    );
  }

  if (error || !chat) {
    return (
      <Card className="mb-4">
        <CardHeader className="py-2">
          <CardTitle className="text-lg">Histórico de Negociação</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground">
          Não há histórico de negociação disponível.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <CardHeader className="py-3">
        <CardTitle className="text-lg flex items-center">
          Negociação de Orçamento {chat.isFinalized && (
            <Badge variant="outline" className="ml-2 bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" /> Aprovado
            </Badge>
          )}
        </CardTitle>
        {chat.initialBudget && (
          <CardDescription>
            <span className="font-medium">
              Orçamento Inicial: {formatCurrency(chat.initialBudget)}
              {chat.finalBudget && ` → Final: ${formatCurrency(chat.finalBudget)}`}
            </span>
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent>
        {chat.messages && chat.messages.length > 0 ? (
          <ScrollArea className="h-[280px] pr-4 border rounded-md p-2">
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
          </ScrollArea>
        ) : (
          <div className="text-center text-muted-foreground py-4">
            Sem mensagens disponíveis.
          </div>
        )}
      </CardContent>
    </Card>
  );
}