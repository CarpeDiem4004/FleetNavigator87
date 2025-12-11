import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Phone, Send, CheckCircle } from 'lucide-react';
import { openWhatsAppWeb, isValidPhoneNumber } from '@/lib/whatsapp-utils';

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
  const { toast } = useToast();

  const formatCurrency = (value: number | string | undefined) => {
    if (!value) return 'R$ 0,00';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return `R$ ${numValue.toFixed(2).replace('.', ',')}`;
  };

  const generateBalanceConfirmationMessage = () => {
    const cartao = solicitation.numero_cartao || solicitation.cartao_combustivel || solicitation.placa;
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

⚠️ *ATENÇÃO:*
Todos os saldos são zerados automaticamente às *16h30*.
Se a solicitação for para abastecer *antes das 16h30*, o abastecimento deve ser realizado dentro desse horário.
Abastecimentos programados para *após as 16h30* terão o saldo disponibilizado somente a partir das *17h*.

Boa viagem! 🚛`;
  };

  const handleOpenDialog = () => {
    const extractedPhone = solicitation.telefone_motorista || solicitation.telefone_celular || '';
    setPhoneNumber(extractedPhone);
    setMessage(generateBalanceConfirmationMessage());
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
        description: 'A mensagem foi aberta no WhatsApp Web. Confira e envie.',
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
          data-testid="button-linehaul-whatsapp"
        >
          <MessageCircle className="h-4 w-4 mr-1" />
          Avisar Saldo
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
            Avisar Saldo no Cartão
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <div className="text-sm text-green-800">
              <strong>Motorista:</strong> {solicitation.motorista || 'Não informado'}
            </div>
            <div className="text-sm text-green-800">
              <strong>Cartão:</strong> {solicitation.numero_cartao || solicitation.cartao_combustivel || solicitation.placa}
            </div>
            <div className="text-sm text-green-800">
              <strong>Valor:</strong> {formatCurrency(solicitation.valor_solicitado)}
            </div>
            {solicitation.rota_origem && solicitation.rota_destino && (
              <div className="text-sm text-green-800">
                <strong>Rota:</strong> {solicitation.rota_origem} → {solicitation.rota_destino}
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

          <div className="flex justify-between gap-3">
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              className="flex-1"
              data-testid="button-cancel-linehaul-whatsapp"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSendWhatsApp}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              data-testid="button-send-linehaul-whatsapp"
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

export default LineHaulWhatsAppButton;
