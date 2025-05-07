import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export function PostoMuriciLinksPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Links para o Posto Murici</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Página Principal</CardTitle>
            <CardDescription>Acesse a página principal do Posto Murici</CardDescription>
          </CardHeader>
          <CardContent>
            <p>A página principal contém o menu de navegação para o Posto Murici.</p>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full"
              onClick={() => {
                console.log("Navegando para /posto-murici");
                // Método múltiplo para navegação garantida
                try {
                  window.history.pushState(null, "", "/posto-murici");
                  window.dispatchEvent(new PopStateEvent("popstate"));
                  
                  // Método alternativo com timeout como fallback
                  setTimeout(() => {
                    window.location.href = "/posto-murici";
                  }, 100);
                } catch (error) {
                  console.error("Erro na navegação:", error);
                  window.location.href = "/posto-murici";
                }
              }}
            >
              Acessar Página Principal
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Interface do Operador</CardTitle>
            <CardDescription>Acesse a interface do operador do Posto Murici</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Interface para registrar abastecimentos e movimentações de pátio.</p>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full"
              onClick={() => {
                console.log("Navegando para /posto-murici/operador");
                // Método múltiplo para navegação garantida
                try {
                  window.history.pushState(null, "", "/posto-murici/operador");
                  window.dispatchEvent(new PopStateEvent("popstate"));
                  
                  // Método alternativo com timeout como fallback
                  setTimeout(() => {
                    window.location.href = "/posto-murici/operador";
                  }, 100);
                } catch (error) {
                  console.error("Erro na navegação:", error);
                  window.location.href = "/posto-murici/operador";
                }
              }}
            >
              Acessar Interface do Operador
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Interface Pública</CardTitle>
            <CardDescription>Acesse a interface pública do Posto Murici</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Interface pública para registro de abastecimentos externos.</p>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full"
              onClick={() => {
                console.log("Navegando para /posto-murici/public");
                // Método múltiplo para navegação garantida
                try {
                  window.history.pushState(null, "", "/posto-murici/public");
                  window.dispatchEvent(new PopStateEvent("popstate"));
                  
                  // Método alternativo com timeout como fallback
                  setTimeout(() => {
                    window.location.href = "/posto-murici/public";
                  }, 100);
                } catch (error) {
                  console.error("Erro na navegação:", error);
                  window.location.href = "/posto-murici/public";
                }
              }}
            >
              Acessar Interface Pública
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default PostoMuriciLinksPage;