import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Check, Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface TwilioWhatsAppButtonProps {
  phone: string;
  placa: string;
  motorista: string;
  valorSolicitado: number;
  status: 'aprovado' | 'negado';
  observacoes?: string;
  provedor?: string;
  dataUso?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export default function TwilioWhatsAppButton({
  phone,
  placa,
  motorista,
  valorSolicitado,
  status,
  observacoes,
  provedor,
  dataUso,
  variant = 'default',
  size = 'sm',
  className = ''
}: TwilioWhatsAppButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const { toast } = useToast();

  const handleSendNotification = async () => {
    if (!phone) {
      toast({
        title: 'Erro',
        description: 'Telefone do solicitante não disponível',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await apiRequest('POST', '/api/fuel-card/send-whatsapp-notification', {
        phone,
        placa,
        motorista,
        valorSolicitado,
        status,
        observacoes,
        provedor,
        dataUso
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsSent(true);
        toast({
          title: 'Enviado com Sucesso!',
          description: 'Notificacao enviada via WhatsApp para o solicitante',
        });
      } else {
        throw new Error(data.error || data.message || 'Erro ao enviar');
      }
    } catch (error: any) {
      console.error('Erro ao enviar notificacao:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Falha ao enviar notificacao WhatsApp',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSent) {
    return (
      <Button
        variant="outline"
        size={size}
        className={`bg-green-50 text-green-700 border-green-300 ${className}`}
        disabled
      >
        <Check className="h-4 w-4 mr-1" />
        Enviado
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleSendNotification}
      disabled={isLoading || !phone}
      className={`bg-[#25D366] hover:bg-[#128C7E] text-white ${className}`}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
      ) : (
        <MessageCircle className="h-4 w-4 mr-1" />
      )}
      {isLoading ? 'Enviando...' : 'Enviar WhatsApp'}
    </Button>
  );
}
