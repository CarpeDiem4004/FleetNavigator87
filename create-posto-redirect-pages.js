/**
 * Script para criar páginas de redirecionamento para todos os postos removidos
 * Este script cria componentes React que redirecionam para o Posto Remédios
 * 
 * Uso: node create-posto-redirect-pages.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lista de postos removidos e suas versões
const removedPostos = [
  { id: 'osasco', name: 'Osasco', version: 'v1' },
  { id: 'osasco_v2', name: 'Osasco', version: 'v2' },
  { id: 'guarulhos', name: 'Guarulhos', version: 'v1' },
  { id: 'guarulhos_v2', name: 'Guarulhos', version: 'v2' },
  { id: 'alair_v2', name: 'Alair', version: 'v2' },
  { id: 'campinas', name: 'Campinas', version: 'v1' },
  { id: 'campinas_v2', name: 'Campinas', version: 'v2' },
  { id: 'abc', name: 'ABC', version: 'v1' },
  { id: 'abc_v2', name: 'ABC', version: 'v2' },
  { id: 'socorro', name: 'Socorro', version: 'v1' },
  { id: 'socorro_v2', name: 'Socorro', version: 'v2' },
  { id: 'sorocaba', name: 'Sorocaba', version: 'v1' },
  { id: 'sorocaba_v2', name: 'Sorocaba', version: 'v2' },
  { id: 'saopaulo', name: 'São Paulo', version: 'v1' },
];

// Diretórios para os componentes
const postoDirPath = path.join(__dirname, 'client', 'src', 'pages', 'postos');
const publicPostoDirPath = path.join(__dirname, 'client', 'src', 'pages', 'postos', 'public');

// Verifica se os diretórios existem, caso contrário cria
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Diretório criado: ${dirPath}`);
  }
}

// Criar um componente de redirecionamento regular
function createRedirectComponent(posto) {
  const capitalizedName = posto.name.charAt(0).toUpperCase() + posto.name.slice(1);
  const fileName = posto.id.charAt(0).toUpperCase() + posto.id.slice(1);
  const version = posto.version === 'v2' ? 'V2' : '';
  
  const componentName = `${fileName}${version}`;
  const filePath = path.join(postoDirPath, `${componentName}.tsx`);
  
  const content = `/**
 * Página de redirecionamento para o Posto ${capitalizedName} ${posto.version.toUpperCase()}
 * Este posto foi removido em Maio/2025 e redireciona para o Posto Remédios
 */

import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InfoIcon } from 'lucide-react';

const ${componentName}: React.FC = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  useEffect(() => {
    toast({
      title: "Posto desativado",
      description: "Este posto foi removido. Redirecionando para o Posto Remédios...",
      variant: "default",
    });
    
    // Redirecionar após um pequeno atraso para permitir que o toast seja exibido
    const timer = setTimeout(() => {
      setLocation('/posto-remedios');
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [setLocation, toast]);
  
  return (
    <div className="container mx-auto py-6 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-center">Posto ${capitalizedName} ${posto.version.toUpperCase()} Desativado</CardTitle>
          <CardDescription className="text-center">
            Este posto não está mais disponível
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="warning" className="mb-4">
            <InfoIcon className="h-5 w-5 mr-2" />
            <AlertTitle>Posto desativado</AlertTitle>
            <AlertDescription>
              O Posto ${capitalizedName} ${posto.version.toUpperCase()} foi desativado em Maio/2025. 
              Você será redirecionado para o Posto Remédios automaticamente.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button 
            onClick={() => setLocation('/posto-remedios')}
            className="w-full"
          >
            Ir para o Posto Remédios agora
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ${componentName};
`;

  fs.writeFileSync(filePath, content);
  console.log(`Arquivo criado: ${filePath}`);
}

// Criar um componente de redirecionamento público
function createPublicRedirectComponent(posto) {
  const capitalizedName = posto.name.charAt(0).toUpperCase() + posto.name.slice(1);
  const fileName = posto.id.charAt(0).toUpperCase() + posto.id.slice(1);
  const version = posto.version === 'v2' ? 'V2' : '';
  
  const componentName = `${fileName}${version}Public`;
  const filePath = path.join(publicPostoDirPath, `${componentName}.tsx`);
  
  const content = `/**
 * Página pública de redirecionamento para o Posto ${capitalizedName} ${posto.version.toUpperCase()}
 * Este posto foi removido em Maio/2025 e redireciona para o Posto Remédios
 */

import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InfoIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ${componentName}: React.FC = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  useEffect(() => {
    toast({
      title: "Posto desativado",
      description: "Este posto foi removido. Redirecionando para o acesso público do Posto Remédios...",
      variant: "default",
    });
    
    // Redirecionar após um pequeno atraso para permitir que o toast seja exibido
    const timer = setTimeout(() => {
      setLocation('/posto-remedios/public');
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [setLocation, toast]);
  
  return (
    <div className="container mx-auto py-6 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-center">Posto ${capitalizedName} ${posto.version.toUpperCase()} Desativado</CardTitle>
          <CardDescription className="text-center">
            Este posto não está mais disponível
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="warning" className="mb-4">
            <InfoIcon className="h-5 w-5 mr-2" />
            <AlertTitle>Posto desativado</AlertTitle>
            <AlertDescription>
              O Posto ${capitalizedName} ${posto.version.toUpperCase()} foi desativado em Maio/2025. 
              Você será redirecionado para o acesso público do Posto Remédios automaticamente.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button 
            onClick={() => setLocation('/posto-remedios/public')}
            className="w-full"
          >
            Ir para o Posto Remédios agora
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ${componentName};
`;

  fs.writeFileSync(filePath, content);
  console.log(`Arquivo criado: ${filePath}`);
}

// Função principal para criar todos os componentes de redirecionamento
function createAllRedirectComponents() {
  console.log('Criando componentes de redirecionamento para postos removidos...');
  
  // Garantir que os diretórios existam
  ensureDirectoryExists(postoDirPath);
  ensureDirectoryExists(publicPostoDirPath);
  
  // Criar componentes para cada posto removido
  removedPostos.forEach(posto => {
    createRedirectComponent(posto);
    createPublicRedirectComponent(posto);
  });
  
  console.log('Todos os componentes de redirecionamento foram criados com sucesso!');
}

// Executar a função principal
createAllRedirectComponents();