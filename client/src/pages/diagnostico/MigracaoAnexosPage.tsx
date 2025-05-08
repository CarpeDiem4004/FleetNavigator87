import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { createClient } from "@supabase/supabase-js";
import { FileText, AlertCircle, Download, Upload, Check, AlertTriangle } from "lucide-react";

// Tipo para solicitações de orçamento
interface BudgetRequest {
  id: number;
  title: string;
  status: string;
  budget_file_url: string;
  budget_file_name: string;
  base_name?: string;
  created_at: string;
}

const MigracaoAnexosPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<BudgetRequest[]>([]);
  const [blobRequests, setBlobRequests] = useState<BudgetRequest[]>([]);
  const [migrating, setMigrating] = useState<{[key: number]: boolean}>({});
  const [migrated, setMigrated] = useState<{[key: number]: boolean}>({});
  const [errors, setErrors] = useState<{[key: number]: string}>({});

  // Inicializar cliente Supabase
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  useEffect(() => {
    fetchBlobAttachments();
  }, []);

  const fetchBlobAttachments = async () => {
    try {
      setLoading(true);
      
      // Buscar todas as solicitações de orçamento
      const response = await apiRequest("GET", "/api/bases/campinas/solicitacao-orcamento");
      
      if (!response.ok) {
        throw new Error("Erro ao carregar solicitações de orçamento");
      }
      
      const data = await response.json();
      setRequests(data);
      
      // Filtrar somente as que possuem URL blob
      const blobUrlRequests = data.filter((req: BudgetRequest) => 
        req.budget_file_url && req.budget_file_url.startsWith('blob:')
      );
      
      setBlobRequests(blobUrlRequests);
      
      setLoading(false);
    } catch (error) {
      console.error("Erro ao buscar anexos:", error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar as solicitações com anexos temporários.",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const downloadAndUploadFile = async (requestId: number, blobUrl: string, fileName: string) => {
    try {
      setMigrating(prev => ({ ...prev, [requestId]: true }));
      setErrors(prev => ({ ...prev, [requestId]: '' }));
      
      // Tentar obter o arquivo da URL blob
      const response = await fetch(blobUrl);
      
      if (!response.ok) {
        throw new Error("Não foi possível acessar o arquivo blob");
      }
      
      // Obter o blob do arquivo
      const fileBlob = await response.blob();
      
      // Upload para o bucket do Supabase
      const filePath = `campinas/budget-attachments/${requestId}/${fileName}`;
      const { data, error } = await supabase.storage
        .from('budget-attachments')
        .upload(filePath, fileBlob, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (error) {
        throw error;
      }
      
      // Obter a URL pública do arquivo
      const { data: urlData } = supabase.storage
        .from('budget-attachments')
        .getPublicUrl(filePath);
      
      const publicUrl = urlData.publicUrl;
      
      // Registrar o anexo permanente no banco de dados
      const registerResponse = await apiRequest("POST", `/api/budget-attachments/register`, {
        budget_request_id: requestId,
        base_id: 2, // ID base Campinas
        base_name: "Base Campinas",
        file_name: fileName,
        file_type: fileBlob.type,
        file_size: fileBlob.size,
        file_path: filePath,
        storage_url: publicUrl,
        attachment_type: "budget"
      });
      
      if (!registerResponse.ok) {
        throw new Error("Erro ao registrar anexo permanente");
      }
      
      // Atualizar URL na tabela de solicitações
      const updateResponse = await apiRequest("PATCH", `/api/bases/campinas/solicitacao-orcamento/${requestId}`, {
        budget_file_url: publicUrl
      });
      
      if (!updateResponse.ok) {
        throw new Error("Erro ao atualizar URL do anexo");
      }
      
      // Atualizar UI
      setMigrated(prev => ({ ...prev, [requestId]: true }));
      toast({
        title: "Anexo migrado com sucesso",
        description: `O anexo "${fileName}" foi migrado para armazenamento permanente.`,
        // @ts-ignore
        variant: "success"
      });
      
      // Atualizar lista
      await fetchBlobAttachments();
    } catch (error) {
      console.error("Erro na migração:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      setErrors(prev => ({ ...prev, [requestId]: errorMessage }));
      toast({
        title: "Erro na migração",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setMigrating(prev => ({ ...prev, [requestId]: false }));
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-4">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Diagnóstico e Migração de Anexos</CardTitle>
            <CardDescription>
              Esta ferramenta identifica anexos temporários (blob) e permite migrá-los para armazenamento permanente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : blobRequests.length === 0 ? (
              <Alert variant="default" className="mb-4">
                <Check className="h-4 w-4" />
                <AlertTitle>Nenhum anexo temporário encontrado</AlertTitle>
                <AlertDescription>
                  Todos os anexos estão usando armazenamento permanente.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <Alert variant="destructive" className="mb-6">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Anexos temporários detectados</AlertTitle>
                  <AlertDescription>
                    {blobRequests.length} solicitações possuem anexos temporários que precisam ser migrados para o armazenamento permanente.
                    Os anexos temporários só podem ser migrados a partir do navegador onde foram originalmente enviados.
                  </AlertDescription>
                </Alert>
              
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Arquivo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {blobRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">{request.id}</TableCell>
                        <TableCell>{request.title}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-2" />
                            {request.budget_file_name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="default">
                            {request.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(request.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {errors[request.id] && (
                            <div className="text-red-500 text-xs mb-2">{errors[request.id]}</div>
                          )}
                          
                          <div className="flex justify-end gap-2">
                            <Button
                              variant={migrated[request.id] ? "outline" : "default"}
                              size="sm"
                              onClick={() => downloadAndUploadFile(
                                request.id, 
                                request.budget_file_url, 
                                request.budget_file_name
                              )}
                              disabled={migrating[request.id] || migrated[request.id]}
                            >
                              {migrating[request.id] ? (
                                <>
                                  <div className="animate-spin h-4 w-4 mr-2 border-b-2 border-white rounded-full"></div>
                                  Migrando...
                                </>
                              ) : migrated[request.id] ? (
                                <>
                                  <Check className="h-4 w-4 mr-1" />
                                  Migrado
                                </>
                              ) : (
                                <>
                                  <Upload className="h-4 w-4 mr-1" />
                                  Migrar para Permanente
                                </>
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default MigracaoAnexosPage;