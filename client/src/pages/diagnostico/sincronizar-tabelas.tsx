import React from 'react';
import MainLayoutSimple from '@/components/layout/MainLayoutSimple';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SincronizarTabelas from './SincronizarTabelas';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function SincronizarTabelasPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <MainLayoutSimple>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Sincronização de Tabelas - Supabase</h1>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/diagnostico/supabase'}
            className="flex items-center"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Diagnóstico
          </Button>
        </div>

        {!isAdmin ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Acesso Restrito</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Esta ferramenta é restrita a administradores do sistema.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-1 gap-6">
            <div className="space-y-6">
              <div className="max-w-3xl mx-auto">
                <SincronizarTabelas />
              </div>
              
              <Card className="max-w-3xl mx-auto mt-8">
                <CardHeader>
                  <CardTitle>Informações sobre a Sincronização</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 text-sm">
                    <p>
                      A ferramenta de sincronização de tabelas permite alinhar o esquema entre o banco de dados
                      PostgreSQL do Replit e o banco do Supabase. Isso resolve incompatibilidades nas tabelas e estruturas.
                    </p>
                    
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 dark:bg-blue-950 dark:border-blue-400">
                      <h3 className="font-medium mb-2">Como funciona:</h3>
                      <ol className="list-decimal ml-5 space-y-1">
                        <li>A ferramenta verifica as tabelas existentes no Supabase</li>
                        <li>Cria tabelas faltantes baseadas no esquema do Replit</li>
                        <li>Verifica e adiciona colunas necessárias em tabelas existentes</li>
                        <li>Gera um relatório do processo com tabelas criadas e erros</li>
                      </ol>
                    </div>
                    
                    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 dark:bg-amber-950 dark:border-amber-400">
                      <h3 className="font-medium mb-2">Mapeamento de tabelas:</h3>
                      <ul className="list-disc ml-5 space-y-1">
                        <li><strong>status_tanques</strong> ↔️ <strong>tanques</strong></li>
                        <li><strong>abastecimentos_postos</strong> ↔️ <strong>abastecimentos</strong></li>
                        <li><strong>recebimentos_combustivel</strong> (nova tabela)</li>
                        <li><strong>controle_patio</strong> (nova tabela)</li>
                      </ul>
                    </div>
                    
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 dark:bg-red-950 dark:border-red-400">
                      <h3 className="font-medium mb-2">⚠️ Atenção:</h3>
                      <p>
                        Esta operação cria novas tabelas e pode modificar estruturas existentes.
                        Recomendamos realizar um backup dos dados antes de prosseguir.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </MainLayoutSimple>
  );
}