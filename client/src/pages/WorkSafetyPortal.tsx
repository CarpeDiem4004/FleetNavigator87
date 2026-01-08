import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, UserPlus, AlertTriangle, GraduationCap, ChevronRight, Truck } from 'lucide-react';
import { Link } from 'wouter';

export default function WorkSafetyPortal() {
  return (
    <div className="min-h-screen bg-[#0E0E0E]">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-[#1C1C1C] rounded-full p-4 shadow-lg border-2 border-[#E10613]">
              <ShieldCheck className="h-12 w-12 text-[#E10613]" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#F5F5F5] mb-2">
            Portal de Segurança do Trabalho
          </h1>
          <p className="text-[#8C8C8C] text-lg">
            Murici On Fleet - Selecione uma opção abaixo
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/work-safety/cadastro-motorista">
              <Card className="cursor-pointer hover:shadow-xl transition-all hover:scale-105 h-full bg-[#1C1C1C] border-l-4 border-l-[#E10613] border-[#333]" data-testid="card-register-driver">
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto bg-[#0E0E0E] rounded-full p-4 mb-2 border border-[#E10613]">
                    <UserPlus className="h-8 w-8 text-[#E10613]" />
                  </div>
                  <CardTitle className="text-xl text-[#F5F5F5]">Cadastrar Motorista</CardTitle>
                  <CardDescription className="text-[#8C8C8C]">
                    Registrar novo motorista no sistema de segurança
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <Button className="w-full bg-[#E10613] hover:bg-[#B8050F] text-white">
                    Acessar <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </Link>

            <Link href="/work-safety/relatar-acidente">
              <Card className="cursor-pointer hover:shadow-xl transition-all hover:scale-105 h-full bg-[#1C1C1C] border-l-4 border-l-[#E10613] border-[#333]" data-testid="card-report-accident">
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto bg-[#0E0E0E] rounded-full p-4 mb-2 border border-[#E10613]">
                    <AlertTriangle className="h-8 w-8 text-[#E10613]" />
                  </div>
                  <CardTitle className="text-xl text-[#F5F5F5]">Relatar Acidente / Incidente</CardTitle>
                  <CardDescription className="text-[#8C8C8C]">
                    Registrar ocorrências de segurança do trabalho
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <Button className="w-full bg-[#E10613] hover:bg-[#B8050F] text-white">
                    Acessar <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </Link>

            <Link href="/work-safety/treinamentos">
              <Card className="cursor-pointer hover:shadow-xl transition-all hover:scale-105 h-full bg-[#1C1C1C] border-l-4 border-l-[#2ECC71] border-[#333]" data-testid="card-trainings">
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto bg-[#0E0E0E] rounded-full p-4 mb-2 border border-[#2ECC71]">
                    <GraduationCap className="h-8 w-8 text-[#2ECC71]" />
                  </div>
                  <CardTitle className="text-xl text-[#F5F5F5]">Treinamentos</CardTitle>
                  <CardDescription className="text-[#8C8C8C]">
                    Ver treinamentos disponíveis e confirmar participação
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <Button className="w-full bg-[#2ECC71] hover:bg-[#27ae60] text-white">
                    Acessar <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </Link>
          </div>

          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 bg-[#1C1C1C] rounded-full px-4 py-2 border border-[#333]">
              <Truck className="h-5 w-5 text-[#E10613]" />
              <span className="text-[#8C8C8C] text-sm">
                Murici Transportes - Segurança em primeiro lugar
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
