import React, { useState } from 'react';
import { useParams } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { SUPABASE_URL, API_KEY, enviarParaSupabase, ENDPOINTS } from '@/constants/supabase';

// Mapeamento de códigos para nomes dos postos
const postoNomes: Record<string, string> = {
  osasco: 'Osasco',
  guarulhos: 'Guarulhos',
  saopaulo: 'São Paulo',
  campinas: 'Campinas',
  abc: 'ABC',
  socorro: 'Socorro',
  sorocaba: 'Sorocaba'
};

type PostoParams = {
  postoCode: string;
};

const PostoFormSimples: React.FC = () => {
  const params = useParams<PostoParams>();
  const postoCode = params.postoCode?.toLowerCase() || '';
  const postoNome = postoNomes[postoCode] || postoCode.toUpperCase();
  
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [form, setForm] = useState({
    placa: '',
    motorista: '',
    km: '',
    litros: '',
    tipo: 'diesel',
    movimento: 'entrada',
    destino: ''
  });
  
  const [loading, setLoading] = useState(false);
  
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement> | 
    { target: { name: string; value: string } }
  ) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Preparar os dados para enviar
      const dados = {
        ...form,
        postoId: postoCode,
        postoNome: postoNome,
        data: new Date().toISOString(),
        usuarioId: user?.id,
        usuarioNome: user?.name
      };
      
      // Enviar para o Supabase
      const response = await enviarParaSupabase(
        ENDPOINTS.ABASTECIMENTOS,
        dados
      );
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      // Limpar o formulário após sucesso
      setForm({
        placa: '',
        motorista: '',
        km: '',
        litros: '',
        tipo: 'diesel',
        movimento: 'entrada',
        destino: ''
      });
      
      toast({
        title: "Sucesso!",
        description: "Abastecimento e movimentação registrados com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao enviar dados:", error);
      toast({
        title: "Erro ao registrar",
        description: "Ocorreu um erro ao registrar o abastecimento. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Posto {postoNome} - Registro de Abastecimento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="placa">Placa do Veículo</Label>
              <Input
                id="placa"
                name="placa"
                value={form.placa}
                onChange={handleChange}
                placeholder="Ex: ABC1234"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="motorista">Nome do Motorista</Label>
              <Input
                id="motorista"
                name="motorista"
                value={form.motorista}
                onChange={handleChange}
                placeholder="Nome completo"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="km">KM Atual</Label>
              <Input
                id="km"
                name="km"
                type="number"
                value={form.km}
                onChange={handleChange}
                placeholder="Ex: 12500"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="litros">Litros Abastecidos</Label>
              <Input
                id="litros"
                name="litros"
                type="number"
                step="0.01"
                value={form.litros}
                onChange={handleChange}
                placeholder="Ex: 150.5"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Combustível</Label>
              <Select 
                value={form.tipo} 
                onValueChange={(value) => handleSelectChange('tipo', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="diesel">Diesel</SelectItem>
                  <SelectItem value="arla">ARLA</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="movimento">Tipo de Movimentação</Label>
              <Select 
                value={form.movimento} 
                onValueChange={(value) => handleSelectChange('movimento', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o movimento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada (pernoite)</SelectItem>
                  <SelectItem value="saida_rota">Saída para Rota</SelectItem>
                  <SelectItem value="saida_manutencao">Saída para Manutenção</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="destino">Destino (opcional)</Label>
              <Input
                id="destino"
                name="destino"
                value={form.destino}
                onChange={handleChange}
                placeholder="Ex: São Paulo"
              />
            </div>
            
            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              {loading ? "Enviando..." : "Enviar Registro"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PostoFormSimples;