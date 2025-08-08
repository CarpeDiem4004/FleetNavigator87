import React, { useState, useEffect, Suspense } from 'react';
import { useRoute } from 'wouter';
import CartaoCombustivelGenerico from './CartaoCombustivelGenerico';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  DollarSign, 
  FileWarning, 
  AlertTriangle, 
  HardHat, 
  CreditCard,
  CircleDot,
  FileText,
  Wrench,
  User
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'wouter';

interface BaseRouteHandlerProps {
  mode: 'despesas' | 'multas' | 'sinistros' | 'acidentes' | 'pneus' | 'orcamentos' | 'manutencao' | 'cartao-combustivel' | 'cartoes-ativos' | 'login';
}

interface BaseInfo {
  id: number;
  name: string;
  location?: string;
  basename?: string;
  operation: string;
}

const BaseRouteHandler: React.FC<BaseRouteHandlerProps> = ({ mode }) => {
  const [match, params] = useRoute('/bases/:baseId/*');
  const [baseInfo, setBaseInfo] = useState<BaseInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<any>({});
  const { user } = useAuth();

  useEffect(() => {
    if (match && params?.baseId) {
      fetchBaseInfo(params.baseId);
    }
  }, [match, params?.baseId]);

  const fetchBaseInfo = async (baseId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/bases/${baseId}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        setBaseInfo(data.data);
      }
    } catch (err) {
      console.error('Erro ao buscar informações da base:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      base_id: baseInfo?.id,
      base_name: baseInfo?.name,
      user_id: user?.id,
      user_name: user?.name,
      created_at: new Date().toISOString()
    };

    try {
      // Aqui você pode adicionar a lógica específica para cada tipo de formulário
      console.log(`Enviando ${mode}:`, submitData);
      
      // Simular envio por enquanto
      alert(`${mode} registrado com sucesso!`);
      setFormData({});
    } catch (error) {
      console.error(`Erro ao registrar ${mode}:`, error);
      alert(`Erro ao registrar ${mode}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin mx-auto mb-4 border-4 border-blue-600 border-t-transparent rounded-full"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!baseInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Base não encontrada</p>
        </div>
      </div>
    );
  }

  const getIcon = () => {
    switch (mode) {
      case 'despesas': return <DollarSign className="w-6 h-6" />;
      case 'multas': return <FileWarning className="w-6 h-6" />;
      case 'sinistros': return <AlertTriangle className="w-6 h-6" />;
      case 'acidentes': return <HardHat className="w-6 h-6" />;
      case 'pneus': return <CircleDot className="w-6 h-6" />;
      case 'orcamentos': return <FileText className="w-6 h-6" />;
      case 'manutencao': return <Wrench className="w-6 h-6" />;
      case 'cartao-combustivel': return <CreditCard className="w-6 h-6" />;
      case 'cartoes-ativos': return <CreditCard className="w-6 h-6" />;
      default: return <FileText className="w-6 h-6" />;
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'despesas': return 'Despesas Mensais';
      case 'multas': return 'Gestão de Multas';
      case 'sinistros': return 'Sinistros e Roubos';
      case 'acidentes': return 'Acidentes de Trabalho';
      case 'pneus': return 'Solicitação de Pneus';
      case 'orcamentos': return 'Solicitação de Orçamentos';
      case 'manutencao': return 'Manutenção de Frota';
      case 'cartao-combustivel': return 'Cartão Combustível';
      case 'cartoes-ativos': return 'Cartões Ativos';
      default: return 'Funcionalidade';
    }
  };

  const renderForm = () => {
    switch (mode) {
      case 'despesas':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Despesa</Label>
              <Select value={formData.tipo || ''} onValueChange={(value) => setFormData({...formData, tipo: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agua">Água</SelectItem>
                  <SelectItem value="energia">Energia</SelectItem>
                  <SelectItem value="telefone">Telefone</SelectItem>
                  <SelectItem value="internet">Internet</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="valor">Valor (R$)</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                value={formData.valor || ''}
                onChange={(e) => setFormData({...formData, valor: e.target.value})}
                placeholder="0,00"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao || ''}
                onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                placeholder="Descreva a despesa..."
              />
            </div>
          </div>
        );

      case 'cartao-combustivel':
        return <CartaoCombustivelGenerico baseId={baseInfo.id} />;

      case 'sinistros':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo_sinistro">Tipo de Sinistro</Label>
              <Select value={formData.tipo_sinistro || ''} onValueChange={(value) => setFormData({...formData, tipo_sinistro: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="roubo">Roubo</SelectItem>
                  <SelectItem value="furto">Furto</SelectItem>
                  <SelectItem value="acidente">Acidente</SelectItem>
                  <SelectItem value="incendio">Incêndio</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="placa_veiculo">Placa do Veículo</Label>
              <Input
                id="placa_veiculo"
                value={formData.placa_veiculo || ''}
                onChange={(e) => setFormData({...formData, placa_veiculo: e.target.value})}
                placeholder="ABC-1234"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="descricao_ocorrencia">Descrição da Ocorrência</Label>
              <Textarea
                id="descricao_ocorrencia"
                value={formData.descricao_ocorrencia || ''}
                onChange={(e) => setFormData({...formData, descricao_ocorrencia: e.target.value})}
                placeholder="Descreva o que aconteceu..."
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="descricao_geral">Descrição</Label>
              <Textarea
                id="descricao_geral"
                value={formData.descricao_geral || ''}
                onChange={(e) => setFormData({...formData, descricao_geral: e.target.value})}
                placeholder="Descreva sua solicitação..."
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href={`/bases/${baseInfo.id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            {getIcon()}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{getTitle()}</h1>
              <p className="text-gray-600">{baseInfo.name} - {baseInfo.operation}</p>
            </div>
          </div>
        </div>

        {/* Formulário */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getIcon()}
              {getTitle()}
            </CardTitle>
            <CardDescription>
              Preencha as informações abaixo para registrar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {renderForm()}
              
              <div className="flex justify-end gap-4">
                <Link href={`/bases/${baseInfo.id}`}>
                  <Button variant="outline">Cancelar</Button>
                </Link>
                <Button type="submit">Registrar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BaseRouteHandler;