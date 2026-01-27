import { useState } from 'react';
import { useSearchParams, Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Wrench, Truck, AlertTriangle, CheckCircle, ArrowLeft, Send } from 'lucide-react';

const BASES = [
  'BH São Gabriel', 'Cariacica', 'Curitiba', 'Gravataí', 'Itajaí',
  'Manaus', 'Paulínia', 'Ribeirão Preto', 'Salvador', 'São José dos Pinhais',
  'Uberlândia', 'Viana', 'São Paulo', 'Campinas', 'Goiânia', 'Recife', 'Fortaleza',
  'Coca Cola ABC', 'Coca Cola Aparecida', 'Coca Cola Santos', 'Coca Cola Pinheiros',
  'Coca Cola Osasco', 'Coca Cola PQ Novo Mundo', 'Coca Cola Embu', 'Coca Cola Ipiranga'
];

export default function MaintenanceRequestForm() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    placa: '',
    modelo: '',
    base_origem: '',
    odometro: '',
    relato_problema: '',
    urgencia: 'media',
    orcamento_previo: '',
    responsavel_base: '',
    telefone_responsavel: ''
  });

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.placa || !formData.base_origem || !formData.relato_problema || !formData.urgencia) {
      toast({ title: 'Erro', description: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/public/maintenance-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          odometro: formData.odometro ? parseInt(formData.odometro) : null,
          orcamento_previo: formData.orcamento_previo ? parseFloat(formData.orcamento_previo.replace(/[^\d,]/g, '').replace(',', '.')) : null
        })
      });

      const result = await response.json();
      if (result.success) {
        setSubmitted(true);
        toast({ title: 'Sucesso', description: 'Solicitação enviada com sucesso!' });
      } else {
        toast({ title: 'Erro', description: result.message || 'Erro ao enviar solicitação', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro de conexão', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-700 mb-2">Solicitação Enviada!</h2>
            <p className="text-gray-600 mb-6">
              Sua solicitação de manutenção foi recebida pela Gestão de Frotas.
              Você receberá uma confirmação via WhatsApp quando o agendamento for realizado.
            </p>
            <Button onClick={() => { setSubmitted(false); setFormData({ placa: '', modelo: '', base_origem: '', odometro: '', relato_problema: '', urgencia: 'media', orcamento_previo: '', responsavel_base: '', telefone_responsavel: '' }); }}>
              Nova Solicitação
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-600 text-white p-4 rounded-t-lg flex items-center gap-3">
          <Wrench className="h-8 w-8" />
          <div>
            <h1 className="text-xl font-bold">Solicitação de Manutenção</h1>
            <p className="text-red-100 text-sm">Murici Transportes - Gestão de Frotas</p>
          </div>
        </div>

        <Card className="rounded-t-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Dados do Veículo e Problema
            </CardTitle>
            <CardDescription>
              Preencha os dados abaixo para solicitar manutenção
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Placa/Prefixo *</Label>
                  <Input
                    placeholder="ABC1234"
                    value={formData.placa}
                    onChange={(e) => setFormData({...formData, placa: e.target.value.toUpperCase()})}
                    maxLength={7}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Modelo</Label>
                  <Input
                    placeholder="Ex: Sprinter 415"
                    value={formData.modelo}
                    onChange={(e) => setFormData({...formData, modelo: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Base de Origem *</Label>
                  <Select value={formData.base_origem} onValueChange={(v) => setFormData({...formData, base_origem: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a base" />
                    </SelectTrigger>
                    <SelectContent>
                      {BASES.map(base => (
                        <SelectItem key={base} value={base}>{base}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Odômetro Atual</Label>
                  <Input
                    placeholder="Ex: 125000"
                    type="number"
                    value={formData.odometro}
                    onChange={(e) => setFormData({...formData, odometro: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Relato do Problema *</Label>
                <Textarea
                  placeholder="Descreva detalhadamente o problema do veículo..."
                  value={formData.relato_problema}
                  onChange={(e) => setFormData({...formData, relato_problema: e.target.value})}
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nível de Urgência *</Label>
                  <Select value={formData.urgencia} onValueChange={(v) => setFormData({...formData, urgencia: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa">🟢 Baixa</SelectItem>
                      <SelectItem value="media">🟡 Média</SelectItem>
                      <SelectItem value="alta">🟠 Alta</SelectItem>
                      <SelectItem value="veiculo_parado">🔴 Veículo Parado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Orçamento Prévio (R$)</Label>
                  <Input
                    placeholder="Ex: 1.500,00"
                    value={formData.orcamento_previo}
                    onChange={(e) => setFormData({...formData, orcamento_previo: e.target.value})}
                  />
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <p className="text-sm font-medium text-gray-700 mb-3">Dados do Responsável (para receber confirmação)</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome do Responsável</Label>
                    <Input
                      placeholder="Seu nome"
                      value={formData.responsavel_base}
                      onChange={(e) => setFormData({...formData, responsavel_base: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>WhatsApp</Label>
                    <Input
                      placeholder="(11) 99999-9999"
                      value={formData.telefone_responsavel}
                      onChange={(e) => setFormData({...formData, telefone_responsavel: formatPhone(e.target.value)})}
                      maxLength={15}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" className="flex-1 bg-red-600 hover:bg-red-700" disabled={loading}>
                  <Send className="h-4 w-4 mr-2" />
                  {loading ? 'Enviando...' : 'Enviar Solicitação'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-gray-500 text-sm mt-4">
          Murici Transportes - Sistema de Gestão de Frotas
        </p>
      </div>
    </div>
  );
}
