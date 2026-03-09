import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Copy, ExternalLink, Check } from 'lucide-react';

interface OficinaResponse {
  success: boolean;
  message: string;
  oficina: {
    id: number;
    razao_social: string;
    cnpj: string;
    email: string;
    telefone: string;
    status: string;
  };
  access: {
    token: string;
    loginLink: string;
    directLink: string;
    credentials: {
      cnpj: string;
      password: string;
    };
  };
}

export default function CadastroOficina() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [oficinaCreated, setOficinaCreated] = useState<OficinaResponse | null>(null);
  
  const [formData, setFormData] = useState({
    razao_social: '',
    nome_fantasia: '',
    cnpj: '',
    endereco: '',
    telefone: '',
    email: '',
    responsavel: '',
    tipo: 'parceira',
    status: 'ativo'
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCNPJ(e.target.value);
    handleInputChange('cnpj', formatted);
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
      toast({
        title: "Copiado!",
        description: "Link copiado para a área de transferência",
      });
    } catch (err) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o link",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.razao_social || !formData.cnpj || !formData.email) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/workshops', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setOficinaCreated(data);
        toast({
          title: "Sucesso!",
          description: data.message,
        });
        
        // Limpar formulário
        setFormData({
          razao_social: '',
          nome_fantasia: '',
          cnpj: '',
          endereco: '',
          telefone: '',
          email: '',
          responsavel: '',
          tipo: 'parceira',
          status: 'ativo'
        });
      } else {
        toast({
          title: "Erro",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao cadastrar oficina",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (oficinaCreated) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Oficina Cadastrada com Sucesso!</h1>
          <Button 
            onClick={() => setOficinaCreated(null)}
            variant="outline"
          >
            Cadastrar Nova Oficina
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Dados da Oficina</CardTitle>
              <CardDescription>Informações cadastradas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-sm font-medium">Razão Social</Label>
                <p className="text-sm text-muted-foreground">{oficinaCreated.oficina.razao_social}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">CNPJ</Label>
                <p className="text-sm text-muted-foreground">{oficinaCreated.oficina.cnpj}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Email</Label>
                <p className="text-sm text-muted-foreground">{oficinaCreated.oficina.email}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Telefone</Label>
                <p className="text-sm text-muted-foreground">{oficinaCreated.oficina.telefone}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Links de Acesso Gerados</CardTitle>
              <CardDescription>Use estes links para acesso da oficina</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Link de Login (Recomendado)</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input 
                    value={oficinaCreated.access.loginLink} 
                    readOnly 
                    className="text-xs"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(oficinaCreated.access.loginLink, 'login')}
                  >
                    {copiedField === 'login' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(oficinaCreated.access.loginLink, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Link Direto com Token</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input 
                    value={oficinaCreated.access.directLink} 
                    readOnly 
                    className="text-xs"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(oficinaCreated.access.directLink, 'direct')}
                  >
                    {copiedField === 'direct' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(oficinaCreated.access.directLink, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="bg-muted p-3 rounded-md">
                <Label className="text-sm font-medium">Credenciais de Acesso</Label>
                <div className="mt-2 space-y-1 text-sm">
                  <p><strong>CNPJ:</strong> {oficinaCreated.access.credentials.cnpj}</p>
                  <p><strong>Senha:</strong> {oficinaCreated.access.credentials.password}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Cadastrar Nova Oficina</h1>
        <p className="text-muted-foreground">
          Os links de acesso serão gerados automaticamente após o cadastro
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Dados da Oficina</CardTitle>
          <CardDescription>
            Preencha as informações da oficina parceira
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="razao_social">Razão Social *</Label>
                <Input
                  id="razao_social"
                  value={formData.razao_social}
                  onChange={(e) => handleInputChange('razao_social', e.target.value)}
                  placeholder="Nome oficial da empresa"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="nome_fantasia">Nome Fantasia</Label>
                <Input
                  id="nome_fantasia"
                  value={formData.nome_fantasia}
                  onChange={(e) => handleInputChange('nome_fantasia', e.target.value)}
                  placeholder="Nome comercial"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="cnpj">CNPJ *</Label>
                <Input
                  id="cnpj"
                  value={formData.cnpj}
                  onChange={handleCNPJChange}
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => handleInputChange('telefone', e.target.value)}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="contato@oficina.com"
                required
              />
            </div>

            <div>
              <Label htmlFor="endereco">Endereço</Label>
              <Textarea
                id="endereco"
                value={formData.endereco}
                onChange={(e) => handleInputChange('endereco', e.target.value)}
                placeholder="Rua, número, bairro, cidade, UF"
                rows={2}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="responsavel">Responsável</Label>
                <Input
                  id="responsavel"
                  value={formData.responsavel}
                  onChange={(e) => handleInputChange('responsavel', e.target.value)}
                  placeholder="Nome do responsável"
                />
              </div>
              
              <div>
                <Label htmlFor="tipo">Tipo</Label>
                <Select 
                  value={formData.tipo} 
                  onValueChange={(value) => handleInputChange('tipo', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="parceira">Parceira</SelectItem>
                    <SelectItem value="terceirizada">Terceirizada</SelectItem>
                    <SelectItem value="interna">Interna</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button 
                type="submit" 
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? 'Cadastrando...' : 'Cadastrar Oficina'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}