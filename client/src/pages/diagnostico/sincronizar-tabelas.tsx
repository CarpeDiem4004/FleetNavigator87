import React from 'react';
import MainLayoutSimple from '@/components/layout/MainLayoutSimple';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SincronizarTabelas from './SincronizarTabelas';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';

export default function SincronizarTabelasPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <MainLayoutSimple>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Sincronização de Tabelas - Supabase</h1>
          <Link href="/diagnostico/supabase">
            <Button 
              variant="outline" 
              className="flex items-center"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Diagnóstico
            </Button>
          </Link>
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
          <div className="flex flex-col space-y-6 max-w-3xl mx-auto">
            <SincronizarTabelas />
            
            <Card>
              <CardHeader>
                <CardTitle>Informações sobre a Sincronização</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm">
                  <p>
                    A ferramenta de verificação de tabelas permite identificar a compatibilidade entre
                    o banco de dados PostgreSQL do Replit e o banco do Supabase. As tabelas faltantes
                    são detectadas e comandos SQL são gerados para criação manual.
                  </p>
                  
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 dark:bg-blue-950 dark:border-blue-400">
                    <h3 className="font-medium mb-2">Como funciona:</h3>
                    <ol className="list-decimal ml-5 space-y-1">
                      <li>A ferramenta verifica as tabelas existentes no Supabase</li>
                      <li>Identifica tabelas faltantes baseadas no esquema do Replit</li>
                      <li>Gera comandos SQL para criação manual das tabelas</li>
                      <li>Permite copiar os comandos para execução no Console SQL do Supabase</li>
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
                      Os comandos SQL devem ser executados manualmente no Console SQL do Supabase.
                      Esta funcionalidade não cria automaticamente as tabelas devido a restrições de permissão.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayoutSimple>
  );
}