import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Phone, Send, CheckCircle, XCircle, Loader2, Zap } from 'lucide-react';
import { openWhatsAppWeb, isValidPhoneNumber } from '@/lib/whatsapp-utils';
import { apiRequest } from '@/lib/queryClient';

interface LineHaulWhatsAppButtonProps {
  solicitation: {
    id: number;
    motorista: string;
    placa: string;
    status: string;
    valor_solicitado?: number | string;
    rota_origem?: string;
    rota_destino?: string;
    telefone_motorista?: string;
    telefone_celular?: string;
    numero_cartao?: string;
    cartao_combustivel?: string;
    provedor_cartao?: string;
    km_total?: number;
    motivo_negacao?: string | null;
    calculo_detalhes?: {
      km_rota?: number;
      km_total?: number;
      litros_necessarios?: string;
    };
  };
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

const LineHaulWhatsAppButton: React.FC<LineHaulWhatsAppButtonProps> = ({
  solicitation,
  variant = 'outline',
  size = 'sm',
  className = ''
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const formatCurrency = (value: number | string | undefined) => {
    if (!value) return 'R$ 0,00';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return `R$ ${numValue.toFixed(2).replace('.', ',')}`;
  };

  const isNegado = solicitation.status?.toLowerCase() === 'negado';

  const generateBalanceConfirmationMessage = () => {
    const rota = solicitation.rota_origem && solicitation.rota_destino 
      ? `${solicitation.rota_origem.toUpperCase()} → ${solicitation.rota_destino.toUpperCase()}`
      : 'Não informada';
    const valor = formatCurrency(solicitation.valor_solicitado);
    const provedor = solicitation.provedor_cartao?.toUpperCase() || 'CARTÃO';
    const km = solicitation.km_total || solicitation.calculo_detalhes?.km_rota || 0;
    
    return `✅ *SALDO LIBERADO - LINE HAUL*

Olá ${solicitation.motorista || 'Motorista'},

O saldo foi colocado no seu cartão ${provedor}!

📋 *Detalhes:*
• Valor: *${valor}*
• Rota: ${rota}
• KM: ${km} km

Boa viagem! 🚛`;
  };

  const generateDeniedMessage = () => {
    const rota = solicitation.rota_origem && solicitation.rota_destino 
      ? `${solicitation.rota_origem.toUpperCase()} → ${solicitation.rota_destino.toUpperCase()}`
      : 'Não informada';
    const motivo = solicitation.motivo_negacao || 'Não especificado';
    
    return `❌ *SOLICITAÇÃO NEGADA - LINE HAUL*

Olá ${solicitation.motorista || 'Motorista'},

Infelizmente sua solicitação de abastecimento foi *negada*.

📋 *Detalhes da Solicitação:*
• Rota: ${rota}

📝 *Motivo da Negação:*
${motivo}

Se tiver dúvidas, entre em contato com a equipe.`;
  };

  const handleOpenDialog = () => {
    const extractedPhone = solicitation.telefone_motorista || solicitation.telefone_celular || '';
    setPhoneNumber(extractedPhone);
    setMessage(isNegado ? generateDeniedMessage() : generateBalanceConfirmationMessage());
    setIsDialogOpen(true);
  };

  const handleSendViaZAPI = async () => {
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

    setIsSending(true);
    try {
      const response = await apiRequest('POST', '/api/whatsapp/send-fuel-card-notification', {
        phone: phoneNumber,
        message: message,
        solicitationId: solicitation.id,
        tipo: isNegado ? 'negacao' : 'aprovacao'
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Mensagem enviada!',
          description: 'O motorista vai receber a notificação no WhatsApp.',
        });
        setIsDialogOpen(false);
      } else {
        throw new Error(data.error || 'Falha ao enviar');
      }
    } catch (error: any) {
      console.error('Erro ao enviar via Z-API:', error);
      toast({
        title: 'Erro ao enviar',
        description: error.message || 'Não foi possível enviar a mensagem. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleOpenWhatsAppWeb = () => {
    if (!phoneNumber.trim() || !message.trim()) {
      toast({
        title: 'Dados obrigatórios',
        description: 'Preencha telefone e mensagem',
        variant: 'destructive'
      });
      return;
    }

    try {
      openWhatsAppWeb(phoneNumber, message);
      toast({
        title: 'WhatsApp aberto',
        description: 'A mensagem foi aberta no WhatsApp Web.',
      });
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Erro ao abrir WhatsApp',
        description: 'Não foi possível abrir o WhatsApp Web.',
        variant: 'destructive'
      });
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cleanValue = value.replace(/[^\d\(\)\s\-]/g, '');
    setPhoneNumber(cleanValue);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={variant} 
          size={size} 
          className={`${className} ${isNegado ? 'text-red-600 hover:text-red-700 hover:bg-red-50' : 'text-green-600 hover:text-green-700 hover:bg-green-50'}`}
          onClick={handleOpenDialog}
          data-testid="button-linehaul-whatsapp"
        >
          <MessageCircle className="h-4 w-4 mr-1" />
          {isNegado ? 'Avisar Negação' : 'Avisar Saldo'}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {isNegado ? (
              <XCircle className="h-5 w-5 mr-2 text-red-600" />
            ) : (
              <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
            )}
            {isNegado ? 'Avisar Negação da Solicitação' : 'Avisar Saldo no Cartão'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className={`p-3 rounded-lg border ${isNegado ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
            <div className={`text-sm ${isNegado ? 'text-red-800' : 'text-green-800'}`}>
              <strong>Motorista:</strong> {solicitation.motorista || 'Não informado'}
            </div>
            {!isNegado && (
              <>
                <div className="text-sm text-green-800">
                  <strong>Cartão:</strong> {solicitation.numero_cartao || solicitation.cartao_combustivel || solicitation.placa}
                </div>
                <div className="text-sm text-green-800">
                  <strong>Valor:</strong> {formatCurrency(solicitation.valor_solicitado)}
                </div>
              </>
            )}
            {solicitation.rota_origem && solicitation.rota_destino && (
              <div className={`text-sm ${isNegado ? 'text-red-800' : 'text-green-800'}`}>
                <strong>Rota:</strong> {solicitation.rota_origem} → {solicitation.rota_destino}
              </div>
            )}
            {isNegado && solicitation.motivo_negacao && (
              <div className="text-sm text-red-800 mt-2">
                <strong>Motivo:</strong> {solicitation.motivo_negacao}
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
              data-testid="input-linehaul-phone"
            />
            <div className="text-xs text-gray-500">
              Formato: (11) 99999-9999 ou 11999999999
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Mensagem de Confirmação</Label>
            <Textarea
              id="message"
              placeholder="Digite sua mensagem..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={10}
              className="resize-none text-sm"
              data-testid="textarea-linehaul-message"
            />
            <div className="text-xs text-gray-500">
              Mensagem pré-preenchida com os dados da solicitação. Você pode editá-la.
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button 
              onClick={handleSendViaZAPI}
              disabled={isSending}
              className={`w-full text-white ${isNegado ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
              data-testid="button-send-linehaul-whatsapp"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Enviar Direto (Z-API)
                </>
              )}
            </Button>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
                className="flex-1"
                disabled={isSending}
                data-testid="button-cancel-linehaul-whatsapp"
              >
                Cancelar
              </Button>
              <Button 
                variant="outline"
                onClick={handleOpenWhatsAppWeb}
                className="flex-1"
                disabled={isSending}
              >
                <Send className="h-4 w-4 mr-2" />
                WhatsApp Web
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LineHaulWhatsAppButton;
