import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { SendHorizontal, DollarSign, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/formatters";

interface ChatMessage {
  id: number;
  chatId: number;
  author: string;
  authorId: number;
  authorName: string;
  message: string;
  sent_at: string;
  proposedBudget: number | null;
}

interface MaintenanceChatHistoryProps {
  maintenanceId: number;
  chatId: number | null;
  initialMessages?: ChatMessage[];
  isWorkshop?: boolean;
  refreshChat?: () => void;
  readOnly?: boolean;
}

const MaintenanceChatHistory: React.FC<MaintenanceChatHistoryProps> = ({
  maintenanceId,
  chatId,
  initialMessages = [],
  isWorkshop = false,
  refreshChat,
  readOnly = false
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [proposedBudget, setProposedBudget] = useState<string>("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Atualizar as mensagens quando as mensagens iniciais mudarem
  useEffect(() => {
    if (initialMessages.length > 0) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);
  
  // Rolar para a última mensagem quando mensagens forem atualizadas
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  // Função para criar um novo chat se não existir
  const createChatIfNeeded = async (): Promise<number | null> => {
    if (chatId) return chatId;
    
    try {
      const response = await fetch("/api/workshop/maintenance-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          maintenanceId,
          initialBudget: proposedBudget ? parseFloat(proposedBudget) : null,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Falha ao criar chat para negociação");
      }
      
      const data = await response.json();
      return data.id;
    } catch (error) {
      console.error("Erro ao criar chat:", error);
      setError("Não foi possível criar o chat. Tente novamente mais tarde.");
      return null;
    }
  };
  
  // Função para carregar as mensagens do chat
  const fetchMessages = async (chatIdToFetch: number) => {
    try {
      const response = await fetch(`/api/workshop/maintenance-chat/${maintenanceId}`);
      
      if (!response.ok) {
        throw new Error("Falha ao buscar mensagens");
      }
      
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error("Erro ao buscar mensagens:", error);
      setError("Não foi possível carregar as mensagens. Tente novamente mais tarde.");
    }
  };
  
  // Função para enviar uma nova mensagem
  const sendMessage = async () => {
    if (!newMessage.trim() && (!proposedBudget || !isWorkshop)) {
      toast({
        title: "Mensagem vazia",
        description: "Digite uma mensagem antes de enviar.",
        variant: "destructive",
      });
      return;
    }
    
    setSending(true);
    setError(null);
    
    try {
      // Se não tiver chatId, tentar criar um novo
      const effectiveChatId = await createChatIfNeeded();
      
      if (!effectiveChatId) {
        setSending(false);
        return;
      }
      
      // Formatar valor do orçamento para número
      let budgetValue = null;
      if (proposedBudget) {
        budgetValue = parseFloat(proposedBudget.replace(/\./g, "").replace(",", "."));
        if (isNaN(budgetValue)) {
          toast({
            title: "Valor inválido",
            description: "O valor do orçamento deve ser um número válido.",
            variant: "destructive",
          });
          setSending(false);
          return;
        }
      }
      
      // Enviar a mensagem
      const response = await fetch("/api/workshop/chat-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatId: effectiveChatId,
          message: newMessage.trim(),
          proposedBudget: budgetValue,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Falha ao enviar mensagem");
      }
      
      // Se tudo der certo, atualizar as mensagens
      if (refreshChat) {
        refreshChat();
      } else {
        fetchMessages(effectiveChatId);
      }
      
      // Limpar campos
      setNewMessage("");
      if (isWorkshop) {
        setProposedBudget("");
      }
      
      toast({
        title: "Mensagem enviada",
        description: "Sua mensagem foi enviada com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      setError("Não foi possível enviar a mensagem. Tente novamente mais tarde.");
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem. Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };
  
  // Formatar a data de envio da mensagem
  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };
  
  return (
    <div className="flex flex-col">
      {/* Área de mensagens */}
      <div className="flex flex-col space-y-4 mb-4 max-h-80 overflow-y-auto p-2">
        {messages.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">
            {error || "Nenhuma mensagem foi enviada ainda. Inicie a conversa!"}
          </p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.author === "gestor_frota" ? "items-end" : "items-start"
              }`}
            >
              <Card
                className={`p-3 max-w-[85%] ${
                  msg.author === "gestor_frota"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <div className="flex flex-col">
                  <p className="text-sm font-medium">{msg.authorName}</p>
                  <p className="text-sm">{msg.message}</p>
                  {msg.proposedBudget && (
                    <div className="mt-2 flex items-center">
                      <DollarSign className="h-4 w-4 mr-1" />
                      <span className="font-semibold">
                        Orçamento: {formatCurrency(msg.proposedBudget)}
                      </span>
                    </div>
                  )}
                  <p className="text-xs mt-1 opacity-70">
                    {formatMessageTime(msg.sent_at)}
                  </p>
                </div>
              </Card>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Área de input */}
      {!readOnly && (
        <div className="flex flex-col space-y-2">
          {isWorkshop && (
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Proposta de orçamento (R$)"
                value={proposedBudget}
                onChange={(e) => {
                  // Permitir apenas números e vírgulas
                  const value = e.target.value.replace(/[^0-9,.]/g, "");
                  setProposedBudget(value);
                }}
                className="flex-1"
              />
            </div>
          )}

          <div className="flex space-x-2">
            <Textarea
              placeholder="Digite sua mensagem..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 resize-none"
              rows={3}
              disabled={sending}
            />
            <Button
              onClick={sendMessage}
              disabled={sending}
              className="self-end"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SendHorizontal className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceChatHistory;