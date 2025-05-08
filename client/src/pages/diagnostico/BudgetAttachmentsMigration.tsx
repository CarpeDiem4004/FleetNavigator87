import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { DownloadCloud, Upload, CheckCircle, RefreshCw, AlertTriangle, ExternalLink } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { supabase, uploadFileToSupabase, registerAttachmentMetadata, BUDGET_ATTACHMENTS_BUCKET } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface BlobAttachment {
  id: number;
  base_id: number;
  base_name: string;
  title: string;
  budget_file_name: string;
  budget_file_url: string;
  requester_id: number;
  requester_name: string;
  status: string;
}

const BudgetAttachmentsMigration: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [blobAttachments, setBlobAttachments] = useState<BlobAttachment[]>([]);
  const [selectedAttachment, setSelectedAttachment] = useState<BlobAttachment | null>(null);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [bucketExists, setBucketExists] = useState(false);
  const [migratedCount, setMigratedCount] = useState(0);

  // Check if user has admin permissions
  const isAdmin = user?.role === 'admin';

  // Initialize: check if bucket exists and get all blob attachments
  useEffect(() => {
    const init = async () => {
      try {
        // Check if bucket exists
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
        
        if (bucketsError) {
          throw new Error(`Erro ao listar buckets: ${bucketsError.message}`);
        }
        
        const exists = buckets.some(b => b.name === BUDGET_ATTACHMENTS_BUCKET);
        setBucketExists(exists);
        
        if (!exists) {
          toast({
            title: 'Bucket não encontrado',
            description: `O bucket "${BUDGET_ATTACHMENTS_BUCKET}" não existe no Supabase Storage.`,
            variant: 'destructive'
          });
        } else {
          // If bucket exists, fetch blob attachments
          await fetchBlobAttachments();
        }
      } catch (error) {
        console.error('Erro na inicialização:', error);
        toast({
          title: 'Erro de inicialização',
          description: `Não foi possível conectar ao Supabase Storage: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
          variant: 'destructive'
        });
      } finally {
        setInitializing(false);
      }
    };
    
    init();
  }, []);

  // Fetch all attachments that use blob URLs
  const fetchBlobAttachments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/diagnostics/blob-attachments');
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar anexos blob: ${response.statusText}`);
      }
      
      const data = await response.json();
      setBlobAttachments(data);
      
      toast({
        title: 'Anexos encontrados',
        description: `${data.length} anexos com URLs blob foram encontrados.`,
        variant: 'default'
      });
    } catch (error) {
      console.error('Erro ao buscar anexos blob:', error);
      toast({
        title: 'Erro',
        description: `Não foi possível buscar os anexos blob: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Create bucket if it doesn't exist
  const createBucket = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.storage.createBucket(BUDGET_ATTACHMENTS_BUCKET, {
        public: true,
        fileSizeLimit: 5242880 // 5MB
      });
      
      if (error) {
        throw error;
      }
      
      setBucketExists(true);
      toast({
        title: 'Bucket criado',
        description: `O bucket "${BUDGET_ATTACHMENTS_BUCKET}" foi criado com sucesso.`,
        variant: 'default'
      });
      
      // Fetch blob attachments after bucket creation
      await fetchBlobAttachments();
    } catch (error) {
      console.error('Erro ao criar bucket:', error);
      toast({
        title: 'Erro',
        description: `Não foi possível criar o bucket: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle file selection for the attachment
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewFile(e.target.files[0]);
    }
  };

  // Migrate a single attachment
  const migrateAttachment = async (attachment: BlobAttachment) => {
    if (!newFile) {
      toast({
        title: 'Arquivo necessário',
        description: 'Você deve selecionar um arquivo para migrar este anexo.',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // 1. Upload file to Supabase Storage
      const uniqueId = Date.now().toString();
      const filePath = `${attachment.base_id}/${attachment.id}/${uniqueId}-${newFile.name}`;
      
      console.log(`Fazendo upload do arquivo para ${filePath}...`);
      const storageUrl = await uploadFileToSupabase(newFile, filePath);
      console.log(`Upload concluído. URL: ${storageUrl}`);
      
      // 2. Register attachment metadata
      await registerAttachmentMetadata(
        attachment.id,
        attachment.base_id,
        attachment.base_name,
        newFile.name,
        filePath,
        storageUrl,
        user?.id || null,
        user?.name || null,
        'budget'
      );
      
      // 3. Update the budget request with the new URL
      const response = await fetch(`/api/diagnostics/update-attachment-url/${attachment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          budget_file_url: storageUrl,
          budget_file_name: newFile.name
        })
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao atualizar URL do anexo: ${response.statusText}`);
      }
      
      // 4. Update UI and reset state
      setMigratedCount(prev => prev + 1);
      setNewFile(null);
      setSelectedAttachment(null);
      
      // 5. Remove this attachment from the list
      setBlobAttachments(prev => prev.filter(a => a.id !== attachment.id));
      
      toast({
        title: 'Anexo migrado',
        description: `O anexo "${attachment.budget_file_name}" foi migrado com sucesso.`,
        variant: 'default'
      });
    } catch (error) {
      console.error('Erro ao migrar anexo:', error);
      toast({
        title: 'Erro',
        description: `Não foi possível migrar o anexo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Render status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Pendente</Badge>;
      case 'aprovado':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Aprovado</Badge>;
      case 'rejeitado':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Rejeitado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Acesso Negado</AlertTitle>
          <AlertDescription>
            Apenas administradores podem acessar esta página de migração.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Migração de Anexos</h1>
          <p className="text-muted-foreground">
            Ferramenta para migrar anexos de URLs blob temporárias para o Supabase Storage
          </p>
        </div>
      </div>
      
      {/* Status card */}
      <Card>
        <CardHeader>
          <CardTitle>Status da Migração</CardTitle>
          <CardDescription>
            Informações sobre a conexão com o Supabase Storage e progresso da migração
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4">
              <div className="text-sm font-medium text-muted-foreground mb-2">Bucket de Armazenamento</div>
              <div className="flex items-center">
                {bucketExists ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
                )}
                <span className="font-bold">
                  {bucketExists ? 'Configurado' : 'Não encontrado'}
                </span>
              </div>
              {!bucketExists && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  onClick={createBucket}
                  disabled={loading}
                >
                  Criar Bucket
                </Button>
              )}
            </div>
            
            <div className="border rounded-lg p-4">
              <div className="text-sm font-medium text-muted-foreground mb-2">Anexos Pendentes</div>
              <div className="flex items-center">
                <span className="text-2xl font-bold">{blobAttachments.length}</span>
                <span className="ml-2 text-sm text-muted-foreground">anexos para migrar</span>
              </div>
            </div>
            
            <div className="border rounded-lg p-4">
              <div className="text-sm font-medium text-muted-foreground mb-2">Anexos Migrados</div>
              <div className="flex items-center">
                <span className="text-2xl font-bold">{migratedCount}</span>
                <span className="ml-2 text-sm text-muted-foreground">anexos migrados</span>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t p-4 bg-muted/50 flex justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchBlobAttachments}
            disabled={loading || initializing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </CardFooter>
      </Card>
      
      {/* Attachments list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Anexos com URLs Temporárias</CardTitle>
              <CardDescription>
                Selecione um anexo para migrar para o Supabase Storage
              </CardDescription>
            </CardHeader>
            <CardContent>
              {initializing ? (
                <div className="flex items-center justify-center p-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Carregando anexos...</span>
                </div>
              ) : blobAttachments.length === 0 ? (
                <div className="text-center p-8 border border-dashed rounded-lg">
                  <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                  <p className="text-muted-foreground">
                    Todos os anexos já foram migrados para o Supabase Storage.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {blobAttachments.map(attachment => (
                    <div
                      key={`${attachment.id}`}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${selectedAttachment?.id === attachment.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                      onClick={() => setSelectedAttachment(attachment)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{attachment.title}</h3>
                          <p className="text-sm text-muted-foreground">{attachment.base_name}</p>
                        </div>
                        <div>
                          {renderStatusBadge(attachment.status)}
                        </div>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex items-center text-sm text-muted-foreground">
                        <span className="mr-2">Arquivo:</span>
                        <span className="font-medium truncate">{attachment.budget_file_name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Migrar Anexo</CardTitle>
              <CardDescription>
                Faça upload do arquivo para migrar o anexo selecionado
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedAttachment ? (
                <div className="space-y-4">
                  <div className="border rounded-lg p-4 bg-muted/50">
                    <h3 className="font-medium">Anexo Selecionado</h3>
                    <p className="text-sm text-muted-foreground">{selectedAttachment.title}</p>
                    <Separator className="my-2" />
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="text-muted-foreground">Base:</span>
                      <span>{selectedAttachment.base_name}</span>
                      <span className="text-muted-foreground">Arquivo:</span>
                      <span>{selectedAttachment.budget_file_name}</span>
                      <span className="text-muted-foreground">Solicitante:</span>
                      <span>{selectedAttachment.requester_name}</span>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">Selecione o arquivo para upload</h3>
                    <Input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                      onChange={handleFileChange}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Formatos suportados: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX
                    </p>
                  </div>
                  
                  <Button
                    className="w-full"
                    disabled={!newFile || loading || !bucketExists}
                    onClick={() => migrateAttachment(selectedAttachment)}
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Migrando...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Migrar Anexo
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed rounded-lg">
                  <DownloadCloud className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    Selecione um anexo da lista para iniciar a migração.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BudgetAttachmentsMigration;