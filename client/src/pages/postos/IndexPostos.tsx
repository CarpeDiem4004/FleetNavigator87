import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Fuel, Droplets, Map, BarChart3, TrendingUp, Target } from 'lucide-react';

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
        
        {/* Seção de Relatórios e Analytics */}
        <div className="mt-12 border-t pt-12">
          <h2 className="text-2xl font-bold text-center mb-6">Relatórios e Analytics</h2>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-8">
            Acesse relatórios detalhados de consumo, histórico consolidado e análises comparativas por projeto e base.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Histórico Consolidado
                </CardTitle>
                <CardDescription>
                  Visualize o histórico consolidado de todos os postos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Dados mensais e anuais de consumo, tendências e estatísticas gerais.
                </p>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full" variant="outline">
                  <Link href="/postos/historico-geral">
                    Ver Histórico
                  </Link>
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Visão Geral Integrada
                </CardTitle>
                <CardDescription>
                  Dashboard executivo com métricas principais
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  KPIs, gráficos de performance e resumo operacional.
                </p>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full" variant="outline">
                  <Link href="/postos/visao-geral">
                    Ver Dashboard
                  </Link>
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  Comparativo por Projeto e Base
                </CardTitle>
                <CardDescription className="text-blue-700">
                  Análise detalhada por projeto e base operacional - NOVO
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-blue-600">
                  Comparativo mensal, projeções anuais e top performers por projeto e base.
                </p>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link href="/postos/comparativo-projeto-base">
                    Ver Comparativo
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
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