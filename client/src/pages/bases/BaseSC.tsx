import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  Clock, 
  Users, 
  Car, 
  FolderOpen, 
  CreditCard, 
  Circle,
  Wrench,
  DollarSign,
  ClipboardList,
  AlertCircle,
  Eye
} from "lucide-react";
import { Link } from 'wouter';

const BaseSC: React.FC = () => {
  const cards = [
    {
      id: 'sinistros',
      title: 'Sinistros e Roubos',
      description: 'Registro de ocorrências com veículos',
      details: 'Comunique sinistros, roubos e outros incidentes envolvendo veículos da frota. Registre detalhes da ocorrência, local, horário e danos.',
      icon: AlertTriangle,
      color: 'bg-red-50 border-red-200',
      buttonColor: 'bg-red-500 hover:bg-red-600',
      href: '/bases/sc/sinistros',
      buttonText: 'Comunicar Sinistro',
      buttonIcon: AlertTriangle
    },
    {
      id: 'acidentes',
      title: 'Acidentes de Trabalho',
      description: 'Registro de acidentes com colaboradores',
      details: 'Reporte acidentes de trabalho e incidentes com colaboradores. Informe detalhes do ocorrido, medidas tomadas e encaminhamentos médicos.',
      icon: Clock,
      color: 'bg-orange-50 border-orange-200',
      buttonColor: 'bg-orange-500 hover:bg-orange-600',
      href: '/bases/sc/acidentes-trabalho',
      buttonText: 'Comunicar Acidente',
      buttonIcon: Clock
    },
    {
      id: 'multas',
      title: 'Gestão de Multas',
      description: 'Comunicados de infração de trânsito',
      details: 'Receba comunicados de multas e infrações de trânsito enviadas pela Gestão de Multas. Visualize detalhes dos veículos, motoristas, datas e valores das infrações.',
      icon: DollarSign,
      color: 'bg-yellow-50 border-yellow-200',
      buttonColor: 'bg-yellow-500 hover:bg-yellow-600',
      href: '/bases/sc/multas',
      buttonText: 'Ver Multas',
      buttonIcon: Eye
    },
    {
      id: 'veiculos',
      title: 'Cadastro de Veículos',
      description: 'Gerenciamento da frota',
      details: 'Cadastre, atualize e gerencie os veículos da Base SC. Registre modelos, placas, ano, informações operacionais e informações técnicas.',
      icon: Car,
      color: 'bg-blue-50 border-blue-200',
      buttonColor: 'bg-blue-500 hover:bg-blue-600',
      href: '/bases/sc/veiculos',
      buttonText: 'Gerenciar Veículos',
      buttonIcon: Car
    },
    {
      id: 'despesas',
      title: 'Despesas Mensais',
      description: 'Controle de despesas da base',
      details: 'Registre e acompanhe despesas mensais como água, energia, funcionários, PJ, aluguel, internet e extras.',
      icon: FolderOpen,
      color: 'bg-indigo-50 border-indigo-200',
      buttonColor: 'bg-indigo-500 hover:bg-indigo-600',
      href: '/bases/sc/despesas',
      buttonText: 'Gerenciar Despesas',
      buttonIcon: FolderOpen
    },
    {
      id: 'pneus',
      title: 'Solicitação de Pneus',
      description: 'Requisição para o time de pneus',
      details: 'Faça solicitações de pneus para o time responsável, especificando modelos, quantidades e justificativas.',
      icon: Circle,
      color: 'bg-green-50 border-green-200',
      buttonColor: 'bg-green-500 hover:bg-green-600',
      href: '/bases/sc/solicitacao-pneus',
      buttonText: 'Solicitar Pneus',
      buttonIcon: Circle
    },
    {
      id: 'orcamentos',
      title: 'Solicitação de Orçamentos',
      description: 'Requisição e aprovação de orçamentos',
      details: 'Solicite orçamentos para serviços ou produtos, aguarde a aprovação da gestão e acompanhe todo o processo.',
      icon: ClipboardList,
      color: 'bg-purple-50 border-purple-200',
      buttonColor: 'bg-purple-500 hover:bg-purple-600',
      href: '/bases/sc/solicitacao-orcamento',
      buttonText: 'Solicitar Orçamento',
      buttonIcon: ClipboardList
    },
    {
      id: 'cartao',
      title: 'Cartão Combustível',
      description: 'Solicitação de saldo e histórico',
      details: 'Solicite recarga de saldo para cartões de combustível e acompanhe o histórico de solicitações e operações.',
      icon: CreditCard,
      color: 'bg-cyan-50 border-cyan-200',
      buttonColor: 'bg-cyan-500 hover:bg-cyan-600',
      href: '/bases/sc/cartao-combustivel',
      buttonText: 'Gerenciar Cartão',
      buttonIcon: CreditCard
    },
    {
      id: 'manutencao',
      title: 'Manutenção de Frota',
      description: 'Solicitação para gestão de frota',
      details: 'Registre solicitações de manutenção para veículos da frota, especificando o tipo de manutenção, prioridade e detalhes.',
      icon: Wrench,
      color: 'bg-amber-50 border-amber-200',
      buttonColor: 'bg-amber-500 hover:bg-amber-600',
      href: '/bases/sc/manutencao-frota',
      buttonText: 'Solicitar Manutenção',
      buttonIcon: Wrench
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            SC (Ribeirão Preto) SSP4
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Gerenciamento completo da Base SC em Ribeirão Preto
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {cards.map((card) => {
            const Icon = card.icon;
            const ButtonIcon = card.buttonIcon;
            
            return (
              <Card 
                key={card.id} 
                className={`${card.color} hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className="h-8 w-8 text-gray-700" />
                    <CardTitle className="text-xl text-gray-900">
                      {card.title}
                    </CardTitle>
                  </div>
                  <CardDescription className="text-gray-600 font-medium">
                    {card.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-gray-700 mb-6 leading-relaxed">
                    {card.details}
                  </p>
                  
                  <Link href={card.href}>
                    <Button 
                      className={`w-full ${card.buttonColor} text-white font-medium py-2.5 flex items-center justify-center gap-2`}
                    >
                      <ButtonIcon className="h-4 w-4" />
                      {card.buttonText}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BaseSC;