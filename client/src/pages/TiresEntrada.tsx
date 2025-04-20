import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from 'wouter';
import { ArrowLeft, Save } from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MainLayoutSimple from '@/components/layout/MainLayoutSimple';
import { createSupabaseClient } from '@/lib/supabase-client';

const TiresEntrada: React.FC = () => {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [formData, setFormData] = useState({
    marca: '',
    modelo: '',
    medida: '',
    aro: '',
    tipo: '',
    origem: '',
    quantidade: 1,
    localizacao: '',
    observacao: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { marca, modelo, medida, aro, tipo, origem, quantidade, localizacao, observacao } = formData;

    // Validar campos obrigatórios
    if (!marca || !modelo || !medida || !tipo || !origem || !localizacao) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const supabase = createSupabaseClient();
      const timestamp = new Date().toISOString();
      
      // 1. Inserir no estoque_pneus
      const { data: estoque, error: estoqueError } = await supabase
        .from('estoque_pneus')
        .insert([
          {
            marca,
            modelo,
            medida,
            aro,
            tipo,
            origem,
            quantidade: parseInt(quantidade.toString()),
            localizacao,
            observacao,
            created_at: timestamp,
            updated_at: timestamp
          },
        ])
        .select('id');

      if (estoqueError) throw estoqueError;
      
      if (!estoque || estoque.length === 0) {
        throw new Error('Falha ao obter ID do registro criado');
      }

      // 2. Criar pneus individuais para cada unidade na quantidade
      for (let i = 0; i < parseInt(quantidade.toString()); i++) {
        const codigo = `${marca.substring(0, 3).toUpperCase()}${modelo.substring(0, 3).toUpperCase()}${(Math.floor(Math.random() * 10000)).toString().padStart(4, '0')}`;
        
        // Inserir pneu individual
        const { error: pneuError } = await supabase
          .from('pneus')
          .insert([
            {
              codigo,
              marca,
              modelo,
              medida,
              aro,
              tipo,
              origem,
              data_aquisicao: timestamp.split('T')[0],
              veiculo_placa: null,
              posicao: null,
              km_inicial: 0,
              km_atual: 0,
              profundidade_sulco: 12.0, // Valor padrão para pneu novo
              localizacao,
              status: 'estoque',
              observacao,
              created_at: timestamp,
              updated_at: timestamp
            },
          ]);

        if (pneuError) throw pneuError;
      }

      // 3. Criar movimentação de entrada
      const { error: movError } = await supabase
        .from('movimentacoes_pneus')
        .insert([
          {
            tipo: 'entrada',
            quantidade: parseInt(quantidade.toString()),
            estoque_id: estoque[0].id,
            observacao,
            created_at: timestamp,
            updated_at: timestamp
          },
        ]);

      if (movError) throw movError;

      toast({
        title: "Entrada registrada com sucesso!",
        description: `${quantidade} pneu(s) ${marca} ${modelo} adicionado(s) ao estoque.`,
        variant: "default"
      });
      
      // Limpar o formulário
      setFormData({
        marca: '',
        modelo: '',
        medida: '',
        aro: '',
        tipo: '',
        origem: '',
        quantidade: 1,
        localizacao: '',
        observacao: '',
      });
    } catch (error) {
      console.error('Erro ao registrar entrada:', error);
      toast({
        title: "Erro ao registrar entrada",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const tiposOptions = [
    { value: 'direcao', label: 'Direção' },
    { value: 'tracao', label: 'Tração' },
    { value: 'trailer', label: 'Trailer/Carreta' },
  ];

  const origensOptions = [
    { value: 'novo', label: 'Novo' },
    { value: 'recapado', label: 'Recapado' },
    { value: 'usado', label: 'Usado' },
  ];

  const localizacoesOptions = [
    { value: 'almoxarifado', label: 'Almoxarifado' },
    { value: 'estoque_borracharia', label: 'Estoque Borracharia' },
    { value: 'transito', label: 'Em Trânsito' },
  ];

  return (
    <MainLayoutSimple>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold mb-2">Entrada de Pneus</h1>
            <p className="text-gray-500">
              Registre a entrada de novos pneus no estoque
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/tires')}
            className="flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>

        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Formulário de Entrada</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Marca do pneu */}
                <div className="space-y-2">
                  <Label htmlFor="marca">Marca *</Label>
                  <Input
                    id="marca"
                    name="marca"
                    placeholder="Ex: Bridgestone, Michelin, etc."
                    value={formData.marca}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Modelo do pneu */}
                <div className="space-y-2">
                  <Label htmlFor="modelo">Modelo *</Label>
                  <Input
                    id="modelo"
                    name="modelo"
                    placeholder="Ex: R250, Duravis, etc."
                    value={formData.modelo}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Medida do pneu */}
                <div className="space-y-2">
                  <Label htmlFor="medida">Medida *</Label>
                  <Input
                    id="medida"
                    name="medida"
                    placeholder="Ex: 295/80R22.5"
                    value={formData.medida}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Aro do pneu */}
                <div className="space-y-2">
                  <Label htmlFor="aro">Aro</Label>
                  <Input
                    id="aro"
                    name="aro"
                    placeholder="Ex: 22.5"
                    value={formData.aro}
                    onChange={handleChange}
                  />
                </div>

                {/* Tipo de pneu */}
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo *</Label>
                  <Select 
                    value={formData.tipo} 
                    onValueChange={(value) => handleSelectChange('tipo', value)}
                    required
                  >
                    <SelectTrigger id="tipo">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Origem do pneu */}
                <div className="space-y-2">
                  <Label htmlFor="origem">Origem *</Label>
                  <Select 
                    value={formData.origem} 
                    onValueChange={(value) => handleSelectChange('origem', value)}
                    required
                  >
                    <SelectTrigger id="origem">
                      <SelectValue placeholder="Selecione a origem" />
                    </SelectTrigger>
                    <SelectContent>
                      {origensOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Localização */}
                <div className="space-y-2">
                  <Label htmlFor="localizacao">Localização *</Label>
                  <Select 
                    value={formData.localizacao} 
                    onValueChange={(value) => handleSelectChange('localizacao', value)}
                    required
                  >
                    <SelectTrigger id="localizacao">
                      <SelectValue placeholder="Selecione a localização" />
                    </SelectTrigger>
                    <SelectContent>
                      {localizacoesOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Quantidade */}
                <div className="space-y-2">
                  <Label htmlFor="quantidade">Quantidade *</Label>
                  <Input
                    id="quantidade"
                    name="quantidade"
                    type="number"
                    min="1"
                    placeholder="Quantidade"
                    value={formData.quantidade}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Observação */}
              <div className="space-y-2">
                <Label htmlFor="observacao">Observação (opcional)</Label>
                <Input
                  id="observacao"
                  name="observacao"
                  placeholder="Observações adicionais"
                  value={formData.observacao}
                  onChange={handleChange}
                />
              </div>

              {/* Submit button */}
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  className="w-full md:w-auto flex items-center gap-2" 
                  disabled={isSubmitting}
                >
                  <Save className="h-4 w-4" />
                  {isSubmitting ? 'Registrando...' : 'Registrar Entrada'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayoutSimple>
  );
};

export default TiresEntrada;