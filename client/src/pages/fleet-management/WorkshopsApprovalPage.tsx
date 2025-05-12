import React from 'react';
import AprovacaoOficinas from "@/pages/oficinas/AprovacaoOficinas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/hooks/use-auth';
import { usePermission } from '@/hooks/use-permission';

export default function WorkshopsApprovalPage() {
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  
  // Verifica se o usuário tem permissão para acessar esta página
  const hasAccess = hasPermission(['admin', 'gestor_frota']);

  // Se não tem permissão, mostra uma mensagem de acesso negado
  if (!hasAccess) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Acesso Negado</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              Você não tem permissão para acessar esta página. Esta funcionalidade é restrita 
              a administradores e gestores de frota.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se tem permissão, mostra o componente de aprovação de oficinas
  return <AprovacaoOficinas />;
}