import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Fuel, ExternalLink } from "lucide-react";

export default function PostosExternosIndex() {
  const postos = [
    {
      name: "Posto ABC V2",
      path: "/posto-externo/abc-v2",
      description: "Registro de recebimentos de combustível - Base ABC"
    },
    {
      name: "Posto Campinas V2", 
      path: "/posto-externo/campinas-v2",
      description: "Registro de recebimentos de combustível - Base Campinas"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-3 mb-4">
            <Fuel className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Postos Externos - Registro de Combustível
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Acesso para operadores de postos registrarem recebimentos de combustível
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {postos.map((posto) => (
            <Card key={posto.path} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Fuel className="h-5 w-5 text-blue-600" />
                  {posto.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">{posto.description}</p>
                <Link href={posto.path}>
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
                    Acessar Sistema
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center">
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-2">Instruções</h3>
            <p className="text-blue-800">
              Operadores de postos devem usar os links acima para registrar recebimentos de combustível. 
              O sistema salva automaticamente os dados no banco central.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}