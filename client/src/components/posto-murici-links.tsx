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
            <Button asChild className="w-full">
              <Link href="/posto-murici">Acessar Página Principal</Link>
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
            <Button asChild className="w-full">
              <Link href="/posto-murici/operador">Acessar Interface do Operador</Link>
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
            <Button asChild className="w-full">
              <Link href="/posto-murici/public">Acessar Interface Pública</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default PostoMuriciLinksPage;