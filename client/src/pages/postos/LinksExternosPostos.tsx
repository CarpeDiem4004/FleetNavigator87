/**
 * Página de links externos para postos
 * Esta página oferece acesso rápido aos URLs públicos de todos os postos
 * para compartilhamento com operadores externos
 */

import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Fuel, 
  Copy, 
  CheckCircle, 
  ExternalLink, 
  Home, 
  Link as LinkIcon 
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/context/AuthContext';

// Lista de postos com links externos
const externosPostos = [
  {
    id: 'osasco_v2',
    nome: 'Osasco V2',
    descricao: 'Link externo para operadores do posto de Osasco',
    url: '/posto/osasco_v2/public'
  },
  {
    id: 'alair_v2',
    nome: 'Alair V2',
    descricao: 'Link externo para operadores do posto Alair',
    url: '/posto/alair_v2/public'
  },
  {
    id: 'campinas_v2',
    nome: 'Campinas V2',
    descricao: 'Link externo para operadores do posto de Campinas',
    url: '/posto/campinas_v2/public'
  },
  {
    id: 'abc_v2',
    nome: 'ABC V2',
    descricao: 'Link externo para operadores do posto do ABC',
    url: '/posto/abc_v2/public'
  },
  {
    id: 'socorro_v2',
    nome: 'Socorro V2',
    descricao: 'Link externo para operadores do posto de Socorro',
    url: '/posto/socorro_v2/public'
  },
  {
    id: 'sorocaba_v2',
    nome: 'Sorocaba V2',
    descricao: 'Link externo para operadores do posto de Sorocaba',
    url: '/posto/sorocaba_v2/public'
  },
  {
    id: 'remedios',
    nome: 'Posto Remédios',
    descricao: 'Link externo para operadores do Posto Remédios',
    url: '/posto-remedios-externo'
  }
];

const LinksExternosPostos: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [copied, setCopied] = useState<Record<string, boolean>>({});
  const [baseUrl, setBaseUrl] = useState('');

  // Efeito para detectar domínio atual
  React.useEffect(() => {
    // Tenta usar o domínio gestaoonfleet.com.br primeiro, se não estiver disponível
    // usa o domínio atual
    const currentDomain = window.location.origin;
    setBaseUrl(currentDomain);
  }, []);

  // Função para copiar link
  const copyToClipboard = (url: string, id: string) => {
    const fullUrl = `${baseUrl}${url}`;
    navigator.clipboard.writeText(fullUrl)
      .then(() => {
        setCopied({ ...copied, [id]: true });
        toast({
          title: "Link copiado!",
          description: "O link foi copiado para a área de transferência."
        });
        
        // Reset copied state after 3 seconds
        setTimeout(() => {
          setCopied(prev => ({ ...prev, [id]: false }));
        }, 3000);
      })
      .catch(err => {
        console.error('Erro ao copiar link:', err);
        toast({
          title: "Erro ao copiar",
          description: "Não foi possível copiar o link. Tente novamente.",
          variant: "destructive"
        });
      });
  };

  // Função para abrir link em nova guia
  const openInNewTab = (url: string) => {
    const fullUrl = `${baseUrl}${url}`;
    window.open(fullUrl, '_blank');
  };

  // Verificar autenticação
  if (!user) {
    return (
      <div className="container mx-auto py-12">
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <CardTitle>Acesso Restrito</CardTitle>
            <CardDescription>
              Você precisa estar autenticado para acessar esta página.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => setLocation('/login')} className="w-full">
              Fazer Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Verificar se o usuário tem permissão (admin ou gestor)
  const hasPermission = user.role === 'admin' || user.role === 'gestor' || user.role === 'gestor_frota' || user.role === 'gestor_combustivel';
  
  if (!hasPermission) {
    return (
      <div className="container mx-auto py-12">
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <CardTitle>Permissão Negada</CardTitle>
            <CardDescription>
              Apenas administradores e gestores podem acessar os links externos para postos.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => setLocation('/')} className="w-full">
              Voltar ao Início
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Links Externos para Postos</h1>
          <p className="text-muted-foreground mt-2">
            Compartilhe estes links com operadores externos para acesso direto aos formulários dos postos.
          </p>
        </div>
        
        <Button 
          variant="outline" 
          onClick={() => setLocation('/')}
          className="flex items-center gap-2"
        >
          <Home className="h-4 w-4" />
          Voltar ao início
        </Button>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl">Informações de Acesso</CardTitle>
          <CardDescription>
            Os links gerados podem ser acessados sem a necessidade de entrar no sistema principal.
            O operador precisará apenas de credenciais básicas para login.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">URL Base:</p>
              <div className="flex items-center gap-2">
                <Input 
                  value={baseUrl} 
                  onChange={(e) => setBaseUrl(e.target.value)}
                  className="font-mono text-sm"
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    // Restaurar URL padrão
                    setBaseUrl(window.location.origin);
                    toast({
                      title: "URL redefinida",
                      description: "A URL base foi restaurada para o valor padrão."
                    });
                  }}
                >
                  Redefinir
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                A URL base será usada como prefixo para todos os links. Altere apenas se necessário.
              </p>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
              <LinkIcon className="h-4 w-4 flex-shrink-0" />
              <p>
                Os links externos precisam de domínio válido para funcionamento correto.
                Para acesso externo, use <code className="bg-white px-1 py-0.5 rounded">gestaoonfleet.com.br</code> como base.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {externosPostos.map((posto) => (
          <Card key={posto.id} className="overflow-hidden">
            <CardHeader className="bg-primary/5">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Fuel className="h-5 w-5 text-primary" />
                {posto.nome}
              </CardTitle>
              <CardDescription>{posto.descricao}</CardDescription>
            </CardHeader>
            
            <CardContent className="pt-4">
              <div className="w-full p-2 bg-muted/50 rounded-md font-mono text-xs overflow-x-auto whitespace-nowrap">
                {baseUrl}{posto.url}
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-between gap-2 border-t bg-muted/10 pt-3">
              <Button 
                onClick={() => copyToClipboard(posto.url, posto.id)}
                variant="outline"
                className="flex-1"
              >
                {copied[posto.id] ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar Link
                  </>
                )}
              </Button>
              
              <Button 
                onClick={() => openInNewTab(posto.url)}
                variant="default"
                className="flex-1"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Abrir
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default LinksExternosPostos;