import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  Clock, 
  Shield, 
  Car, 
  CreditCard, 
  Wrench, 
  FileText, 
  Receipt, 
  Truck
} from "lucide-react";
import { Link } from 'wouter';
import { useAuth } from '@/context/AuthContext';

interface BaseSCTemplateProps {
  baseName: string;
  baseCode: string;
  baseLocation: string;
  baseSlug: string;
}

const BaseSCTemplate: React.FC<BaseSCTemplateProps> = ({ 
  baseName, 
  baseCode, 
  baseLocation, 
  baseSlug 
}) => {
  const { user } = useAuth();
  
  // Função para determinar saudação baseada no horário
  const getSaudacao = () => {
    const hora = new Date().getHours();
    if (hora < 12) return "Bom dia";
    if (hora < 18) return "Boa tarde";
    return "Boa noite";
  };
  const functionalities = [
    {
      id: 1,
      title: "Sinistros e Roubos",
      description: "Registre de ocorrências com veículos\n\nComunique sinistros, roubos e outros incidentes envolvendo veículos da frota. Registre detalhes da ocorrência, local, horário e danos.",
      icon: AlertTriangle,
      color: "bg-red-500",
      link: `/bases/${baseSlug}/sinistros`,
      buttonColor: "bg-red-500 hover:bg-red-600",
      buttonText: "⚠️ Comunicar Sinistro"
    },
    {
      id: 2,
      title: "Acidentes de Trabalho",
      description: "Registre de acidentes com colaboradores\n\nReporte acidentes de trabalho e incidentes com colaboradores. Informe detalhes do ocorrido, medidas tomadas e encaminhamentos médicos.",
      icon: Clock,
      color: "bg-orange-500",
      link: `/bases/${baseSlug}/acidentes-trabalho`,
      buttonColor: "bg-orange-500 hover:bg-orange-600",
      buttonText: "🕐 Comunicar Acidente"
    },
    {
      id: 3,
      title: "Gestão de Multas",
      description: "Comunicados de infração de trânsito\n\nReceba comunicados de multas e infrações de trânsito enviadas pela Gestão de Multas. Visualize detalhes dos veículos, motoristas, datas e valores das infrações.",
      icon: Shield,
      color: "bg-yellow-500",
      link: `/bases/${baseSlug}/multas`,
      buttonColor: "bg-yellow-500 hover:bg-yellow-600",
      buttonText: "📋 Ver Multas"
    },
    {
      id: 4,
      title: "Cadastro de Veículos",
      description: "Gerenciamento da frota\n\nCadastre, atualize e gerencie os veículos da Base SC. Registre modelos, placas, ano, informações operacionais e informações técnicas.",
      icon: Car,
      color: "bg-blue-500",
      link: `/bases/${baseSlug}/veiculos`,
      buttonColor: "bg-blue-500 hover:bg-blue-600",
      buttonText: "🚗 Gerenciar Veículos"
    },
    {
      id: 5,
      title: "Despesas Mensais",
      description: "Controle de despesas da base\n\nRegistre e acompanhe despesas mensais como água, energia, funcionários, PJ, aluguel, internet e extras.",
      icon: Receipt,
      color: "bg-purple-500",
      link: `/bases/${baseSlug}/despesas`,
      buttonColor: "bg-purple-500 hover:bg-purple-600",
      buttonText: "💰 Gerenciar Despesas"
    },
    {
      id: 6,
      title: "Solicitação de Pneus",
      description: "Requisição para o time de pneus\n\nFaça solicitações de pneus para o time responsável, especificando modelos, quantidades e justificativas.",
      icon: Wrench,
      color: "bg-green-500",
      link: `/bases/${baseSlug}/pneus`,
      buttonColor: "bg-green-500 hover:bg-green-600",
      buttonText: "⚙️ Solicitar Pneus"
    },
    {
      id: 7,
      title: "Solicitação de Orçamentos",
      description: "Requisição e aprovação de orçamentos\n\nSolicite orçamentos para serviços ou produtos, aguarde a aprovação da gestão e acompanhe todo o processo.",
      icon: FileText,
      color: "bg-purple-600",
      link: `/bases/${baseSlug}/orcamentos`,
      buttonColor: "bg-purple-600 hover:bg-purple-700",
      buttonText: "📄 Solicitar Orçamento"
    },
    {
      id: 8,
      title: "Cartão Combustível",
      description: "Solicitação de saldo e histórico\n\nSolicite recarga de saldo para cartões de combustível e acompanhe o histórico de solicitações e operações.",
      icon: CreditCard,
      color: "bg-cyan-500",
      link: `/bases/${baseSlug}/cartao-combustivel`,
      buttonColor: "bg-cyan-500 hover:bg-cyan-600",
      buttonText: "💳 Gerenciar Cartão"
    },
    {
      id: 9,
      title: "Manutenção de Frota",
      description: "Solicitação para gestão de frota\n\nRegistre solicitações de manutenção para veículos da frota, especificando o tipo de manutenção, prioridade e detalhes.",
      icon: Truck,
      color: "bg-orange-600",
      link: `/bases/${baseSlug}/manutencao`,
      buttonColor: "bg-orange-600 hover:bg-orange-700",
      buttonText: "🔧 Solicitar Manutenção"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          {user && (
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-blue-700 mb-2">
                {getSaudacao()}, {user.name}!
              </h2>
              <p className="text-gray-600">
                Bem-vindo ao painel da base {baseName}
              </p>
            </div>
          )}
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {baseName} {baseCode}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Gerenciamento completo da Base {baseName.split(' ')[1]} em {baseLocation}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {functionalities.map((func) => {
            const IconComponent = func.icon;
            return (
              <Card key={func.id} className="hover:shadow-lg transition-shadow duration-200 border-0 shadow-md bg-white/80 backdrop-blur-sm h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-3 rounded-lg ${func.color} text-white`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <Badge className="bg-green-100 text-green-800 border-green-300 text-xs">
                      Ativo
                    </Badge>
                  </div>
                  <CardTitle className="text-lg font-semibold text-gray-900 mb-2">
                    {func.title}
                  </CardTitle>
                  <CardDescription className="text-gray-600 text-sm leading-relaxed min-h-[80px]">
                    {func.description.split('\n').map((line, index) => (
                      <span key={index}>
                        {line}
                        {index < func.description.split('\n').length - 1 && <br />}
                      </span>
                    ))}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Link to={func.link}>
                    <Button 
                      className={`w-full ${func.buttonColor} text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 text-sm`}
                    >
                      {func.buttonText}
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

export default BaseSCTemplate;