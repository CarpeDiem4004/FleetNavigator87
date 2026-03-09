/**
 * Script automatizado para gerar todas as 64 bases SC
 * com componentes, logins e rotas padronizadas
 */

const fs = require('fs');
const path = require('path');

// Dados das bases SC do banco de dados
const scBases = [
  { id: 69, name: "SC (ABC) SSP17", location: "ABC, SP", slug: "abc", code: "SSP17" },
  { id: 70, name: "SC (ARACATUBA) SSP10", location: "Araçatuba, SP", slug: "aracatuba", code: "SSP10" },
  { id: 71, name: "SC (ARENA BARUERI) SSP5", location: "Barueri, SP", slug: "arena-barueri", code: "SSP5" },
  { id: 72, name: "SC (ATIBAIA) SSP25", location: "Atibaia, SP", slug: "atibaia", code: "SSP25" },
  { id: 73, name: "SC (AVARÉ) SSP24", location: "Avaré, SP", slug: "avare", code: "SSP24" },
  { id: 74, name: "SC (BAHIA SALVADOR) SBA1", location: "Salvador, BA", slug: "bahia-salvador", code: "SBA1" },
  { id: 75, name: "SC (BAURU) SSP14", location: "Bauru, SP", slug: "bauru", code: "SSP14" },
  { id: 152, name: "SC (BLUMENAU) SSC3", location: "Blumenau, SC", slug: "blumenau", code: "SSC3" },
  { id: 153, name: "SC (BRASÍLIA) SDP1", location: "Brasília, DF", slug: "brasilia", code: "SDP1" },
  { id: 154, name: "SC (CAMPINA GRANDE DO SUL) SPR8", location: "Campina Grande do Sul, PR", slug: "campina-grande-sul", code: "SPR8" },
  { id: 79, name: "SC (CAMPINAS S3) SSP3", location: "Campinas, SP", slug: "campinas-s3", code: "SSP3" },
  { id: 80, name: "SC (CAMPINAS S7) SSP37", location: "Campinas, SP", slug: "campinas-s7", code: "SSP37" },
  { id: 81, name: "SC (CAMPO GRANDE) SMS1", location: "Campo Grande, MS", slug: "campo-grande", code: "SMS1" },
  { id: 82, name: "SC (CARAGUATATUBA) SSP16", location: "Caraguatatuba, SP", slug: "caraguatatuba", code: "SSP16" },
  { id: 83, name: "SC (CASCAVEL) SPR3", location: "Cascavel, PR", slug: "cascavel", code: "SPR3" },
  { id: 84, name: "SC (CHAPECÓ) SSC4", location: "Chapecó, SC", slug: "chapeco", code: "SSC4" },
  { id: 85, name: "SC (CONTAGEM) SMG1", location: "Contagem, MG", slug: "contagem", code: "SMG1" },
  { id: 86, name: "SC (COTIA) SSP34", location: "Cotia, SP", slug: "cotia", code: "SSP34" },
  { id: 87, name: "SC (CRICIÚMA) SSC5-SDD", location: "Criciúma, SC", slug: "criciuma", code: "SSC5-SDD" },
  { id: 88, name: "SC (CUIABÁ) SMR1", location: "Cuiabá, MT", slug: "cuiaba", code: "SMR1" },
  { id: 89, name: "SC (CURITIBA) SPR1", location: "Curitiba, PR", slug: "curitiba", code: "SPR1" },
  { id: 90, name: "SC (DIVINÓPOLIS) SMG10", location: "Divinópolis, MG", slug: "divinopolis", code: "SMG10" },
  { id: 91, name: "SC (FLORIANÓPOLIS) SSC2", location: "Florianópolis, SC", slug: "florianopolis", code: "SSC2" },
  { id: 92, name: "SC (FORTALEZA) SCE1", location: "Fortaleza, CE", slug: "fortaleza", code: "SCE1" },
  { id: 93, name: "SC (FRANCA) SSP26", location: "Franca, SP", slug: "franca", code: "SSP26" },
  { id: 94, name: "SC (FULL FILMENTE) FULL", location: "Filial Plena", slug: "full-filmente", code: "FULL" },
  { id: 95, name: "SC (GOIÂNIA) SGO1", location: "Goiânia, GO", slug: "goiania", code: "SGO1" },
  { id: 96, name: "SC (GUARAPUAVA) SPR5", location: "Guarapuava, PR", slug: "guarapuava", code: "SPR5" },
  { id: 97, name: "SC (ITAPETININGA) SSP27", location: "Itapetininga, SP", slug: "itapetininga", code: "SSP27" },
  { id: 98, name: "SC (ITAQUERA) SSP45", location: "Itaquera, SP", slug: "itaquera", code: "SSP45" },
  { id: 99, name: "SC (ITUPEVA) SSP38-SDD", location: "Itupeva, SP", slug: "itupeva", code: "SSP38-SDD" },
  { id: 100, name: "SC (JALES) SSP28", location: "Jales, SP", slug: "jales", code: "SSP28" },
  { id: 101, name: "SC (JOINVILLE) SSC1", location: "Joinville, SC", slug: "joinville", code: "SSC1" },
  { id: 102, name: "SC (LAJEADO) SRS10-SDD", location: "Lajeado, RS", slug: "lajeado", code: "SRS10-SDD" },
  { id: 103, name: "SC (LONDRINA) SPR2", location: "Londrina, PR", slug: "londrina", code: "SPR2" },
  { id: 104, name: "SC (MANAUS) SAM1", location: "Manaus, AM", slug: "manaus", code: "SAM1" },
  { id: 105, name: "SC (MARÍLIA) SSP13", location: "Marília, SP", slug: "marilia", code: "SSP13" },
  { id: 106, name: "SC (MARINGÁ) SPR6", location: "Maringá, PR", slug: "maringa", code: "SPR6" },
  { id: 107, name: "SC (MEGA GUARULHOS) SSP30", location: "Guarulhos, SP", slug: "mega-guarulhos", code: "SSP30" },
  { id: 108, name: "SC (MOGI DAS CRUZES) SSP23", location: "Mogi das Cruzes, SP", slug: "mogi-cruzes", code: "SSP23" },
  { id: 109, name: "SC (MOOCA CENTRO) SSP21", location: "Mooca, SP", slug: "mooca-centro", code: "SSP21" },
  { id: 110, name: "SC (PASSO FUNDO) SRS5-SDD", location: "Passo Fundo, RS", slug: "passo-fundo", code: "SRS5-SDD" },
  { id: 111, name: "SC (PATO BRANCO) SPR4", location: "Pato Branco, PR", slug: "pato-branco", code: "SPR4" },
  { id: 112, name: "SC (PATOS MINAS) SMG11-SDD", location: "Patos de Minas, MG", slug: "patos-minas", code: "SMG11-SDD" },
  { id: 113, name: "SC (PELOTAS) SRS2", location: "Pelotas, RS", slug: "pelotas", code: "SRS2" },
  { id: 114, name: "SC (PIRACICABA) SSP36", location: "Piracicaba, SP", slug: "piracicaba", code: "SSP36" },
  { id: 115, name: "SC (POÇOS DE CALDAS) SMG5", location: "Poços de Caldas, MG", slug: "pocos-caldas", code: "SMG5" },
  { id: 116, name: "SC (PONTA GROSSA) SPR7", location: "Ponta Grossa, PR", slug: "ponta-grossa", code: "SPR7" },
  { id: 117, name: "SC (PORTO ALEGRE) SRS1", location: "Porto Alegre, RS", slug: "porto-alegre", code: "SRS1" },
  { id: 118, name: "SC (PQ NOVO MUNDO) SSP40", location: "Parque Novo Mundo, SP", slug: "pq-novo-mundo", code: "SSP40" },
  { id: 119, name: "SC (PRESIDENTE PRUDENTE) SSP11", location: "Presidente Prudente, SP", slug: "presidente-prudente", code: "SSP11" },
  { id: 120, name: "SC (QUEIMADOS) SRJ2", location: "Queimados, RJ", slug: "queimados", code: "SRJ2" },
  { id: 121, name: "SC (RECIFE) SPE1", location: "Recife, PE", slug: "recife", code: "SPE1" },
  { id: 122, name: "SC (RIBEIRÃO PRETO) SSP4", location: "Ribeirão Preto, SP", slug: "sc", code: "SSP4" }, // Base principal já existe
  { id: 123, name: "SC (SANTA MARIA) SRS3", location: "Santa Maria, RS", slug: "santa-maria", code: "SRS3" },
  { id: 124, name: "SC (SANTOS) SSP15-SDD", location: "Santos, SP", slug: "santos", code: "SSP15-SDD" },
  { id: 125, name: "SC (SÃO CARLOS) SSP22", location: "São Carlos, SP", slug: "sao-carlos", code: "SSP22" },
  { id: 126, name: "SC (SÃO JOSÉ DOS CAMPOS) SSP8", location: "São José dos Campos, SP", slug: "sao-jose-campos", code: "SSP8" },
  { id: 127, name: "SC (SAPUCAIA) SRS8", location: "Sapucaia do Sul, RS", slug: "sapucaia", code: "SRS8" },
  { id: 128, name: "SC (SJ RIO PRETO) SSP12", location: "São José do Rio Preto, SP", slug: "sj-rio-preto", code: "SSP12" },
  { id: 129, name: "SC (SOROCABA) SSP20", location: "Sorocaba, SP", slug: "sorocaba", code: "SSP20" },
  { id: 130, name: "SC (VITÓRIA) SES1-SDD", location: "Vitória, ES", slug: "vitoria", code: "SES1-SDD" },
  { id: 131, name: "SC (Z LESTE) SSP6", location: "Zona Leste, SP", slug: "z-leste", code: "SSP6" },
  { id: 132, name: "SC (Z SUL) SC_ZS", location: "Zona Sul, SP", slug: "z-sul", code: "SC_ZS" }
];

// Função para gerar componente de base
function generateBaseComponent(base) {
  const componentName = `Base${base.slug.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')}`;
  const displayName = base.name.replace('SC (', '').replace(')', '');
  
  return `import React from 'react';
import BaseSCTemplate from '@/components/bases/BaseSCTemplate';

const ${componentName}: React.FC = () => {
  return (
    <BaseSCTemplate 
      baseName="${displayName}"
      baseCode="${base.code}"
      baseLocation="${base.location}"
      baseSlug="${base.slug}"
    />
  );
};

export default ${componentName};`;
}

// Função para gerar componente de login
function generateLoginComponent(base) {
  const componentName = `Login${base.slug.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')}`;
  const displayName = base.name.replace('SC (', '').replace(')', '');
  
  return `import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from '@/context/AuthContext';
import { Link, useLocation } from 'wouter';
import { Eye, EyeOff, LogIn, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ${componentName}: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login(email, password);
      
      if (result.success) {
        toast({
          title: "Login realizado com sucesso!",
          description: "Redirecionando para a Base ${displayName}...",
        });
        navigate('/bases/${base.slug}');
      } else {
        setError(result.message || 'Erro ao fazer login');
      }
    } catch (err) {
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg bg-white/90 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-blue-600 rounded-full">
              <LogIn className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            ${displayName} ${base.code}
          </CardTitle>
          <p className="text-gray-600">
            Faça login para acessar a Base ${displayName}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Senha
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
            {error && (
              <Alert className="bg-red-50 border-red-200">
                <AlertDescription className="text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            )}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 disabled:opacity-50"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <Link to="/dashboard">
              <Button
                variant="outline"
                className="text-gray-600 hover:text-gray-800 bg-white/80 backdrop-blur-sm border-gray-300 hover:bg-gray-50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Sistema Principal
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ${componentName};`;
}

// Função principal para gerar todos os arquivos
function generateAllSCBases() {
  const clientDir = path.join(__dirname, '..', 'client', 'src', 'pages', 'bases');
  
  // Criar diretório se não existir
  if (!fs.existsSync(clientDir)) {
    fs.mkdirSync(clientDir, { recursive: true });
  }

  let imports = [];
  let routes = [];
  let loginRoutes = [];

  // Gerar componentes para cada base (exceto a sc que já existe)
  scBases.forEach(base => {
    if (base.slug === 'sc') return; // Pular base principal que já existe
    
    const componentName = `Base${base.slug.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')}`;
    const loginComponentName = `Login${base.slug.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')}`;
    
    // Gerar arquivo de componente base
    const baseComponent = generateBaseComponent(base);
    const baseFilePath = path.join(clientDir, `${componentName}.tsx`);
    fs.writeFileSync(baseFilePath, baseComponent);
    
    // Gerar arquivo de componente login
    const loginComponent = generateLoginComponent(base);
    const loginFilePath = path.join(clientDir, `${loginComponentName}.tsx`);
    fs.writeFileSync(loginFilePath, loginComponent);
    
    // Adicionar imports e rotas
    imports.push(`import ${componentName} from "@/pages/bases/${componentName}";`);
    imports.push(`import ${loginComponentName} from "@/pages/bases/${loginComponentName}";`);
    
    routes.push(`            <Route path="/bases/${base.slug}">
              <ProtectedRoute>
                <${componentName} />
              </ProtectedRoute>
            </Route>`);
    
    loginRoutes.push(`            <Route path="/bases/${base.slug}/login">
              <${loginComponentName} />
            </Route>`);
  });

  // Gerar arquivo de rotas para adicionar ao App.tsx
  const routesContent = `
// IMPORTS PARA ADICIONAR AO APP.TSX
${imports.join('\n')}

// ROTAS PARA ADICIONAR AO APP.TSX
${routes.join('\n')}

// ROTAS DE LOGIN PARA ADICIONAR AO APP.TSX
${loginRoutes.join('\n')}
`;

  fs.writeFileSync(path.join(__dirname, 'sc-routes-generated.txt'), routesContent);

  console.log(`✓ Geradas ${scBases.length - 1} bases SC com componentes e logins`);
  console.log(`✓ Arquivo de rotas gerado: scripts/sc-routes-generated.txt`);
  console.log(`✓ Total de arquivos criados: ${(scBases.length - 1) * 2}`);
}

// Executar geração
generateAllSCBases();