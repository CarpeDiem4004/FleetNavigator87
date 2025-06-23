import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Phone, Send } from 'lucide-react';
import { 
  generateFuelCardMessage, 
  openWhatsAppWeb, 
  isValidPhoneNumber, 
  extractPhoneFromText,
  isLineHallRequest,
  formatPhoneNumber
} from '@/lib/whatsapp-utils';

interface WhatsAppResponseButtonProps {
  solicitation: {
    id: number;
    motorista: string;
    placa: string;
    status: string;
    valor_solicitado?: number | string;
    observacoes?: string;
    telefone_motorista?: string;
    telefone_celular?: string;
    origem_tipo?: string;
    base?: string;
    tipo_cartao?: string;
  };
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

const WhatsAppResponseButton: React.FC<WhatsAppResponseButtonProps> = ({
  solicitation,
  variant = 'outline',
  size = 'sm',
  className = ''
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const { toast } = useToast();

  // Verificar se é solicitação do Line Hall (deve ser excluída)
  if (isLineHallRequest(solicitation)) {
    return null;
  }

  const handleOpenDialog = () => {
    // Priorizar telefone_celular da solicitação, depois telefone_motorista, depois extrair das observações
    let extractedPhone = solicitation.telefone_celular || solicitation.telefone_motorista || '';
    
    if (!extractedPhone && solicitation.observacoes) {
      const phoneFromText = extractPhoneFromText(solicitation.observacoes);
      if (phoneFromText) {
        extractedPhone = phoneFromText;
      }
    }

    setPhoneNumber(extractedPhone);
    
    // Gerar mensagem padrão baseada no status
    const defaultMessage = generateFuelCardMessage(
      solicitation.motorista,
      solicitation.placa,
      solicitation.status,
      solicitation.valor_solicitado,
      solicitation.observacoes
    );
    
    setMessage(defaultMessage);
    setIsDialogOpen(true);
  };

  const handleSendWhatsApp = () => {
    if (!phoneNumber.trim()) {
      toast({
        title: 'Número obrigatório',
        description: 'Por favor, informe o número de telefone do motorista',
        variant: 'destructive'
      });
      return;
    }

    if (!isValidPhoneNumber(phoneNumber)) {
      toast({
        title: 'Número inválido',
        description: 'Por favor, verifique o formato do número de telefone',
        variant: 'destructive'
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: 'Mensagem obrigatória',
        description: 'Por favor, escreva uma mensagem para enviar',
        variant: 'destructive'
      });
      return;
    }

    try {
      openWhatsAppWeb(phoneNumber, message);
      
      toast({
        title: 'WhatsApp aberto',
        description: 'A conversa foi aberta no WhatsApp Web. Confira e envie a mensagem.',
      });
      
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Erro ao abrir WhatsApp',
        description: 'Não foi possível abrir o WhatsApp Web. Verifique se o serviço está disponível.',
        variant: 'destructive'
      });
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Permitir apenas números, parênteses, espaços e hífen
    const cleanValue = value.replace(/[^\d\(\)\s\-]/g, '');
    setPhoneNumber(cleanValue);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={variant} 
          size={size} 
          className={`${className} text-green-600 hover:text-green-700 hover:bg-green-50`}
          onClick={handleOpenDialog}
        >
          <MessageCircle className="h-4 w-4 mr-1" />
          WhatsApp
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <MessageCircle className="h-5 w-5 mr-2 text-green-600" />
            Responder via WhatsApp
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-600">
              <strong>Motorista:</strong> {solicitation.motorista}
            </div>
            <div className="text-sm text-gray-600">
              <strong>Veículo:</strong> {solicitation.placa}
            </div>
            <div className="text-sm text-gray-600">
              <strong>Status:</strong> {solicitation.status}
            </div>
            {solicitation.valor_solicitado && (
              <div className="text-sm text-gray-600">
                <strong>Valor:</strong> R$ {(() => {
                  const valor = parseFloat(solicitation.valor_solicitado.toString());
                  return isNaN(valor) ? '0.00' : valor.toFixed(2);
                })()}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center">
              <Phone className="h-4 w-4 mr-1" />
              Telefone do Motorista *
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="(11) 99999-9999"
              value={phoneNumber}
              onChange={handlePhoneChange}
              className="font-mono"
            />
            <div className="text-xs text-gray-500">
              Formato: (11) 99999-9999 ou 11999999999
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Mensagem</Label>
            <Textarea
              id="message"
              placeholder="Digite sua mensagem..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              className="resize-none"
            />
            <div className="text-xs text-gray-500">
              A mensagem foi gerada automaticamente baseada no status da solicitação. Você pode editá-la conforme necessário.
            </div>
          </div>

          <div className="flex justify-between gap-3">
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSendWhatsApp}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              <Send className="h-4 w-4 mr-2" />
              Abrir WhatsApp
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WhatsAppResponseButton;