import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, UserPlus, AlertTriangle, GraduationCap, ChevronRight, Truck, Copy, Check, Share2 } from 'lucide-react';
import { Link } from 'wouter';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import muriciBgImage from '@assets/murici-logo.png';

export default function WorkSafetyPortal() {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  const portalLink = typeof window !== 'undefined' 
    ? `${window.location.origin}/work-safety/portal`
    : '/work-safety/portal';

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(portalLink);
      setCopied(true);
      toast({
        title: "Link copiado!",
        description: "O link do portal foi copiado para a área de transferência.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o link. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Portal de Segurança do Trabalho - Murici',
          text: 'Acesse o Portal de Segurança do Trabalho da Murici Transportes',
          url: portalLink,
        });
      } catch (err) {
        copyLink();
      }
    } else {
      copyLink();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-white rounded-full p-4 shadow-lg">
              <ShieldCheck className="h-12 w-12 text-blue-600" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Portal de Segurança do Trabalho
          </h1>
          <p className="text-blue-100 text-lg">
            Murici On Fleet - Selecione uma opção abaixo
          </p>
          
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-2">
            <div className="bg-white/10 backdrop-blur rounded-lg px-4 py-2 flex items-center gap-2 max-w-md w-full">
              <span className="text-white/80 text-sm truncate flex-1 text-left">
                {portalLink}
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={copyLink}
                className="text-white hover:bg-white/20 shrink-0"
                data-testid="button-copy-link"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <Button 
              onClick={shareLink}
              className="bg-white text-blue-600 hover:bg-blue-50 shrink-0"
              data-testid="button-share-link"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Compartilhar
            </Button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/work-safety/cadastro-motorista">
              <Card className="cursor-pointer hover:shadow-xl transition-all hover:scale-105 h-full" data-testid="card-register-driver">
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto bg-blue-100 rounded-full p-4 mb-2">
                    <UserPlus className="h-8 w-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">Cadastrar Motorista</CardTitle>
                  <CardDescription>
                    Registrar novo motorista no sistema de segurança
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <Button variant="outline" className="w-full">
                    Acessar <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </Link>

            <Link href="/work-safety/relatar-acidente">
              <Card className="cursor-pointer hover:shadow-xl transition-all hover:scale-105 h-full" data-testid="card-report-accident">
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto bg-red-100 rounded-full p-4 mb-2">
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                  </div>
                  <CardTitle className="text-xl">Relatar Acidente / Incidente</CardTitle>
                  <CardDescription>
                    Registrar ocorrências de segurança do trabalho
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <Button variant="outline" className="w-full">
                    Acessar <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </Link>

            <Link href="/work-safety/treinamentos">
              <Card className="cursor-pointer hover:shadow-xl transition-all hover:scale-105 h-full" data-testid="card-trainings">
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto bg-green-100 rounded-full p-4 mb-2">
                    <GraduationCap className="h-8 w-8 text-green-600" />
                  </div>
                  <CardTitle className="text-xl">Treinamentos</CardTitle>
                  <CardDescription>
                    Ver treinamentos disponíveis e confirmar participação
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <Button variant="outline" className="w-full">
                    Acessar <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </Link>
          </div>

          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
              <Truck className="h-5 w-5 text-blue-200" />
              <span className="text-blue-100 text-sm">
                Murici Transportes - Segurança em primeiro lugar
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
