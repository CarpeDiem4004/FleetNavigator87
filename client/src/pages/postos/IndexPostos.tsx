import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Fuel, Droplets, Map } from 'lucide-react';

const IndexPostos: React.FC = () => {
  const postos = [
    { id: 'osasco', nome: 'Osasco', descricao: 'Posto de abastecimento da região de Osasco' },
    { id: 'guarulhos', nome: 'Alair', descricao: 'Posto de abastecimento Alair' },
    // São Paulo removido - Abril/2025
    { id: 'campinas', nome: 'Campinas', descricao: 'Posto de abastecimento da região de Campinas' },
    { id: 'campinas_v2', nome: 'Campinas V2', descricao: 'Posto de abastecimento da região de Campinas (Nova Versão)' },
    // ABC removido - Maio/2025
    // Socorro versão antiga removida - Maio/2025
    { id: 'socorro_v2', nome: 'Socorro V2', descricao: 'Posto de abastecimento da região de Socorro (Nova Versão)' },
    { id: 'sorocaba_v2', nome: 'Sorocaba V2', descricao: 'Posto de abastecimento da região de Sorocaba (Nova Versão)' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <div className="mr-4 flex">
            <Link href="/" className="flex items-center space-x-2">
              <span className="font-bold text-xl">Murícion Fleet</span>
            </Link>
          </div>
          <div className="flex-1 flex justify-center">
            <h1 className="text-2xl font-bold text-center text-primary">
              Postos de Abastecimento
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
              Área Administrativa
            </Link>
          </div>
        </div>
      </header>
      
      {/* Conteúdo principal */}
      <main className="container py-10">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-center mb-6">Selecione um Posto</h2>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto">
            Escolha o posto de abastecimento para registrar operações como abastecimento de veículos, 
            recebimento de combustível ou controle de pátio.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {postos.map((posto) => (
            <Card key={posto.id} className="flex flex-col h-full hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Fuel className="h-5 w-5 text-primary" />
                  {posto.nome}
                </CardTitle>
                <CardDescription>{posto.descricao}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Droplets className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Diesel e ARLA disponíveis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Map className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Pátio para pernoite</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link href={`/posto/${posto.id}`}>
                    Acessar Posto
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>
      
      {/* Footer */}
      <footer className="border-t bg-background py-6">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row md:py-0">
          <div className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            © {new Date().getFullYear()} Murícion Fleet. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default IndexPostos;