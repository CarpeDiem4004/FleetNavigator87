import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CalendarIcon, Check, FileText, Upload } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import BaseCampinasLayout from '@/components/layouts/BaseCampinasLayout';

interface WorkAccident {
  id: number;
  data: string;
  funcionario: string;
  local: string;
  descricao: string;
  statusAtual: string;
  tipoAcidente: string;
  gravidade: string;
  medidasTomadas: string;
  documentoUrl?: string;
  caatUrl?: string;
}

const AcidentesTrabalho = () => {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState('registrar');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedAccident, setSelectedAccident] = useState<WorkAccident | null>(null);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [documentType, setDocumentType] = useState<'documento' | 'caat'>('documento');
  
  // Form state
  const [data, setData] = useState<Date | undefined>(new Date());
  const [funcionario, setFuncionario] = useState('');
  const [local, setLocal] = useState('');
  const [descricao, setDescricao] = useState('');
  const [tipoAcidente, setTipoAcidente] = useState('');
  const [gravidade, setGravidade] = useState('');
  const [medidasTomadas, setMedidasTomadas] = useState('');
  
  // Mock data for the table
  const [acidentes, setAcidentes] = useState<WorkAccident[]>([
    {
      id: 1,
      data: '2025-05-01',
      funcionario: 'Carlos Silva',
      local: 'Galpão de Carregamento',
      descricao: 'Escorregou durante carga de caminhão',
      statusAtual: 'Em acompanhamento',
      tipoAcidente: 'Escorregão/Queda',
      gravidade: 'Média',
      medidasTomadas: 'Afastamento por 7 dias',
      documentoUrl: '',
    },
    {
      id: 2,
      data: '2025-04-23',
      funcionario: 'Ana Oliveira',
      local: 'Escritório Administrativo',
      descricao: 'Dor nos punhos por digitação prolongada',
      statusAtual: 'Finalizado',
      tipoAcidente: 'Ergonômico',
      gravidade: 'Baixa',
      medidasTomadas: 'Ajuste de mobiliário e pausas programadas',
      documentoUrl: 'https://example.com/documento1.pdf',
      caatUrl: 'https://example.com/caat1.pdf',
    },
    {
      id: 3,
      data: '2025-04-15',
      funcionario: 'Roberto Mendes',
      local: 'Área de Manutenção',
      descricao: 'Corte na mão durante manutenção de veículo',
      statusAtual: 'Finalizado',
      tipoAcidente: 'Corte',
      gravidade: 'Baixa',
      medidasTomadas: 'Primeiros socorros e reforço do uso de EPIs',
      documentoUrl: 'https://example.com/documento2.pdf',
      caatUrl: 'https://example.com/caat2.pdf',
    }
  ]);

  // Function to handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    setTimeout(() => {
      const newAccident: WorkAccident = {
        id: acidentes.length + 1,
        data: data ? format(data, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        funcionario,
        local,
        descricao,
        statusAtual: 'Registrado',
        tipoAcidente,
        gravidade,
        medidasTomadas,
      };
      
      setAcidentes([...acidentes, newAccident]);
      
      // Reset form
      setData(new Date());
      setFuncionario('');
      setLocal('');
      setDescricao('');
      setTipoAcidente('');
      setGravidade('');
      setMedidasTomadas('');
      
      toast({
        title: "Acidente de trabalho registrado",
        description: "O registro foi criado com sucesso.",
      });
      
      setLoading(false);
      setSelectedTab('historico');
    }, 1000);
  };

  // Function to handle document upload
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !selectedAccident) return;
    
    setUploadingDocument(true);
    
    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        
        // Update the accident with the document URL
        const updatedAccidents = acidentes.map(accident => {
          if (accident.id === selectedAccident.id) {
            if (documentType === 'documento') {
              return { ...accident, documentoUrl: URL.createObjectURL(e.target.files![0]) };
            } else {
              return { ...accident, caatUrl: URL.createObjectURL(e.target.files![0]) };
            }
          }
          return accident;
        });
        
        setAcidentes(updatedAccidents);
        
        setTimeout(() => {
          setUploadingDocument(false);
          setUploadProgress(0);
          setUploadModalOpen(false);
          
          toast({
            title: "Documento anexado",
            description: "O documento foi anexado com sucesso.",
          });
        }, 500);
      }
    }, 300);
  };

  return (
    <BaseCampinasLayout>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Acidentes de Trabalho - Base Campinas</CardTitle>
          <CardDescription>
            Gerenciamento de ocorrências de acidentes de trabalho relacionados à Base Campinas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="registrar">Registrar Novo</TabsTrigger>
              <TabsTrigger value="historico">Histórico</TabsTrigger>
            </TabsList>
            
            <TabsContent value="registrar">
              <Card>
                <CardHeader>
                  <CardTitle>Novo Registro de Acidente de Trabalho</CardTitle>
                  <CardDescription>
                    Preencha os dados para registrar um novo acidente de trabalho.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="data">Data do Acidente</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className="w-full justify-start text-left font-normal"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {data ? format(data, 'PPP', { locale: pt }) : <span>Selecione uma data</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={data}
                              onSelect={setData}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="funcionario">Funcionário</Label>
                        <Input
                          id="funcionario"
                          value={funcionario}
                          onChange={(e) => setFuncionario(e.target.value)}
                          placeholder="Nome do funcionário"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="local">Local do Acidente</Label>
                        <Input
                          id="local"
                          value={local}
                          onChange={(e) => setLocal(e.target.value)}
                          placeholder="Local onde ocorreu o acidente"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="tipoAcidente">Tipo de Acidente</Label>
                        <Select value={tipoAcidente} onValueChange={setTipoAcidente} required>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Escorregão/Queda">Escorregão/Queda</SelectItem>
                            <SelectItem value="Corte">Corte</SelectItem>
                            <SelectItem value="Esmagamento">Esmagamento</SelectItem>
                            <SelectItem value="Ergonômico">Ergonômico</SelectItem>
                            <SelectItem value="Químico">Químico</SelectItem>
                            <SelectItem value="Queimadura">Queimadura</SelectItem>
                            <SelectItem value="Outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="gravidade">Gravidade</Label>
                        <Select value={gravidade} onValueChange={setGravidade} required>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a gravidade" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Baixa">Baixa</SelectItem>
                            <SelectItem value="Média">Média</SelectItem>
                            <SelectItem value="Alta">Alta</SelectItem>
                            <SelectItem value="Gravíssima">Gravíssima</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="medidasTomadas">Medidas Tomadas</Label>
                        <Input
                          id="medidasTomadas"
                          value={medidasTomadas}
                          onChange={(e) => setMedidasTomadas(e.target.value)}
                          placeholder="Medidas tomadas imediatamente"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="descricao">Descrição do Acidente</Label>
                      <Textarea
                        id="descricao"
                        value={descricao}
                        onChange={(e) => setDescricao(e.target.value)}
                        placeholder="Descreva detalhadamente como ocorreu o acidente"
                        rows={4}
                        required
                      />
                    </div>
                    
                    <div className="pt-4">
                      <Button type="submit" className="w-full md:w-auto" disabled={loading}>
                        {loading ? "Salvando..." : "Registrar Acidente"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="historico">
              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Acidentes de Trabalho</CardTitle>
                  <CardDescription>
                    Visualize e gerencie os registros de acidentes de trabalho ocorridos.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Funcionário</TableHead>
                          <TableHead>Local</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Gravidade</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Documentos</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {acidentes.map((acidente) => (
                          <TableRow key={acidente.id}>
                            <TableCell>{format(new Date(acidente.data), 'dd/MM/yyyy')}</TableCell>
                            <TableCell>{acidente.funcionario}</TableCell>
                            <TableCell>{acidente.local}</TableCell>
                            <TableCell>{acidente.tipoAcidente}</TableCell>
                            <TableCell>{acidente.gravidade}</TableCell>
                            <TableCell>{acidente.statusAtual}</TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                {acidente.documentoUrl ? (
                                  <a href={acidente.documentoUrl} target="_blank" rel="noopener noreferrer">
                                    <Button variant="outline" size="sm">
                                      <FileText className="h-4 w-4 mr-1" /> Documento
                                    </Button>
                                  </a>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedAccident(acidente);
                                      setDocumentType('documento');
                                      setUploadModalOpen(true);
                                    }}
                                  >
                                    <Upload className="h-4 w-4 mr-1" /> Documento
                                  </Button>
                                )}
                                
                                {acidente.caatUrl ? (
                                  <a href={acidente.caatUrl} target="_blank" rel="noopener noreferrer">
                                    <Button variant="outline" size="sm">
                                      <FileText className="h-4 w-4 mr-1" /> CAT
                                    </Button>
                                  </a>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedAccident(acidente);
                                      setDocumentType('caat');
                                      setUploadModalOpen(true);
                                    }}
                                  >
                                    <Upload className="h-4 w-4 mr-1" /> CAT
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Upload Document Modal */}
      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {documentType === 'documento' ? 'Anexar Documento' : 'Anexar CAT (Comunicação de Acidente de Trabalho)'}
            </DialogTitle>
            <DialogDescription>
              {documentType === 'documento' 
                ? 'Faça upload do documento relacionado ao acidente.' 
                : 'Faça upload da CAT (Comunicação de Acidente de Trabalho).'}
            </DialogDescription>
          </DialogHeader>
          
          {uploadingDocument ? (
            <div className="space-y-4 py-4">
              <div className="h-2 w-full bg-secondary overflow-hidden rounded-full">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-center text-sm">Carregando documento... {uploadProgress}%</p>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <Label htmlFor="documentUpload">Selecione o arquivo</Label>
              <Input
                id="documentUpload"
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleUpload}
              />
              <p className="text-sm text-muted-foreground">
                Formatos aceitos: PDF, DOC, DOCX, JPG, JPEG, PNG
              </p>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadModalOpen(false)} disabled={uploadingDocument}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </BaseCampinasLayout>
  );
};

export default AcidentesTrabalho;