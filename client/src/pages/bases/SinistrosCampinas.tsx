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
import { CalendarIcon, Check, FileText, Upload, AlertTriangle, Car, Caravan, LucideIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import BaseCampinasLayout from '@/components/layouts/BaseCampinasLayout';
import { Badge } from '@/components/ui/badge';

interface Sinistro {
  id: number;
  data: string;
  placa: string;
  veiculo: string;
  motorista: string;
  tipo: 'roubo' | 'acidente' | 'furto' | 'dano';
  local: string;
  descricao: string;
  status: 'registrado' | 'em_analise' | 'concluido';
  boletimOcorrenciaUrl?: string;
  laudoPericial?: string;
  seguradoraProtocolo?: string;
}

// Mapeamento de cores e ícones para tipos de sinistro
const tipoSinistroConfig: Record<string, { cor: string; icone: LucideIcon; texto: string }> = {
  roubo: { cor: 'bg-red-100 text-red-800', icone: AlertTriangle, texto: 'Roubo' },
  furto: { cor: 'bg-red-100 text-red-800', icone: AlertTriangle, texto: 'Furto' },
  acidente: { cor: 'bg-orange-100 text-orange-800', icone: Car, texto: 'Acidente' },
  dano: { cor: 'bg-yellow-100 text-yellow-800', icone: Caravan, texto: 'Dano' }
};

// Mapeamento de status
const statusConfig: Record<string, { cor: string; texto: string }> = {
  registrado: { cor: 'bg-blue-100 text-blue-800', texto: 'Registrado' },
  em_analise: { cor: 'bg-amber-100 text-amber-800', texto: 'Em Análise' },
  concluido: { cor: 'bg-green-100 text-green-800', texto: 'Concluído' }
};

const SinistrosCampinas = () => {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState('registrar');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedSinistro, setSelectedSinistro] = useState<Sinistro | null>(null);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [documentType, setDocumentType] = useState<'boletimOcorrencia' | 'laudoPericial'>('boletimOcorrencia');
  
  // Form state
  const [data, setData] = useState<Date | undefined>(new Date());
  const [placa, setPlaca] = useState('');
  const [veiculo, setVeiculo] = useState('');
  const [motorista, setMotorista] = useState('');
  const [tipo, setTipo] = useState<'roubo' | 'acidente' | 'furto' | 'dano'>('acidente');
  const [local, setLocal] = useState('');
  const [descricao, setDescricao] = useState('');
  const [seguradoraProtocolo, setSeguradoraProtocolo] = useState('');
  
  // Mock data for the table
  const [sinistros, setSinistros] = useState<Sinistro[]>([
    {
      id: 1,
      data: '2025-05-03',
      placa: 'ABC-1234',
      veiculo: 'Fiorino - Frota 054',
      motorista: 'João Silva',
      tipo: 'acidente',
      local: 'Rodovia Anhanguera, km 120',
      descricao: 'Colisão traseira ao parar no semáforo',
      status: 'em_analise',
      boletimOcorrenciaUrl: 'https://example.com/bo123.pdf',
    },
    {
      id: 2,
      data: '2025-04-28',
      placa: 'DEF-5678',
      veiculo: 'VUC - Frota 112',
      motorista: 'Maria Oliveira',
      tipo: 'roubo',
      local: 'Avenida das Amoreiras, Campinas',
      descricao: 'Veículo roubado durante parada para entrega',
      status: 'concluido',
      boletimOcorrenciaUrl: 'https://example.com/bo124.pdf',
      laudoPericial: 'https://example.com/laudo124.pdf',
      seguradoraProtocolo: 'SGRD-78945612'
    },
    {
      id: 3,
      data: '2025-04-20',
      placa: 'GHI-9012',
      veiculo: 'Van - Frota 087',
      motorista: 'Carlos Mendes',
      tipo: 'dano',
      local: 'Estacionamento CD Campinas',
      descricao: 'Dano à lateral do veículo durante manobra no estacionamento',
      status: 'concluido',
      boletimOcorrenciaUrl: 'https://example.com/bo125.pdf',
      seguradoraProtocolo: 'SGRD-78441122'
    }
  ]);

  // Function to handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    setTimeout(() => {
      const novoSinistro: Sinistro = {
        id: sinistros.length + 1,
        data: data ? format(data, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        placa,
        veiculo,
        motorista,
        tipo,
        local,
        descricao,
        status: 'registrado',
        seguradoraProtocolo
      };
      
      setSinistros([...sinistros, novoSinistro]);
      
      // Reset form
      setData(new Date());
      setPlaca('');
      setVeiculo('');
      setMotorista('');
      setTipo('acidente');
      setLocal('');
      setDescricao('');
      setSeguradoraProtocolo('');
      
      toast({
        title: "Sinistro registrado",
        description: "O registro de sinistro foi criado com sucesso.",
      });
      
      setLoading(false);
      setSelectedTab('historico');
    }, 1000);
  };

  // Function to handle document upload
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !selectedSinistro) return;
    
    setUploadingDocument(true);
    
    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        
        // Update the sinistro with the document URL
        const updatedSinistros = sinistros.map(sinistro => {
          if (sinistro.id === selectedSinistro.id) {
            if (documentType === 'boletimOcorrencia') {
              return { ...sinistro, boletimOcorrenciaUrl: URL.createObjectURL(e.target.files![0]) };
            } else {
              return { ...sinistro, laudoPericial: URL.createObjectURL(e.target.files![0]) };
            }
          }
          return sinistro;
        });
        
        setSinistros(updatedSinistros);
        
        setTimeout(() => {
          setUploadingDocument(false);
          setUploadProgress(0);
          setUploadModalOpen(false);
          
          toast({
            title: "Documento anexado",
            description: `O ${documentType === 'boletimOcorrencia' ? 'Boletim de Ocorrência' : 'Laudo Pericial'} foi anexado com sucesso.`,
          });
        }, 500);
      }
    }, 300);
  };

  return (
    <BaseCampinasLayout>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Sinistros - Base Campinas</CardTitle>
          <CardDescription>
            Gerenciamento de ocorrências de sinistros relacionados à Base Campinas.
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
                  <CardTitle>Novo Registro de Sinistro</CardTitle>
                  <CardDescription>
                    Preencha os dados para registrar um novo sinistro.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="data">Data do Sinistro</Label>
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
                        <Label htmlFor="tipo">Tipo de Sinistro</Label>
                        <Select value={tipo} onValueChange={(value: 'roubo' | 'acidente' | 'furto' | 'dano') => setTipo(value)} required>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="acidente">Acidente</SelectItem>
                            <SelectItem value="roubo">Roubo</SelectItem>
                            <SelectItem value="furto">Furto</SelectItem>
                            <SelectItem value="dano">Dano</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="placa">Placa do Veículo</Label>
                        <Input
                          id="placa"
                          value={placa}
                          onChange={(e) => setPlaca(e.target.value)}
                          placeholder="ABC-1234"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="veiculo">Veículo (modelo/frota)</Label>
                        <Input
                          id="veiculo"
                          value={veiculo}
                          onChange={(e) => setVeiculo(e.target.value)}
                          placeholder="Modelo e número da frota"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="motorista">Motorista</Label>
                        <Input
                          id="motorista"
                          value={motorista}
                          onChange={(e) => setMotorista(e.target.value)}
                          placeholder="Nome do motorista"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="local">Local do Sinistro</Label>
                        <Input
                          id="local"
                          value={local}
                          onChange={(e) => setLocal(e.target.value)}
                          placeholder="Endereço/local onde ocorreu"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="descricao">Descrição do Sinistro</Label>
                      <Textarea
                        id="descricao"
                        value={descricao}
                        onChange={(e) => setDescricao(e.target.value)}
                        placeholder="Descreva detalhadamente o que aconteceu"
                        rows={4}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="seguradoraProtocolo">Protocolo da Seguradora (opcional)</Label>
                      <Input
                        id="seguradoraProtocolo"
                        value={seguradoraProtocolo}
                        onChange={(e) => setSeguradoraProtocolo(e.target.value)}
                        placeholder="Número do protocolo junto à seguradora"
                      />
                    </div>
                    
                    <div className="pt-4">
                      <Button type="submit" className="w-full md:w-auto" disabled={loading}>
                        {loading ? "Salvando..." : "Registrar Sinistro"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="historico">
              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Sinistros</CardTitle>
                  <CardDescription>
                    Visualize e gerencie os registros de sinistros ocorridos.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Placa</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Motorista</TableHead>
                          <TableHead>Local</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Documentos</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sinistros.map((sinistro) => {
                          const tipoConfig = tipoSinistroConfig[sinistro.tipo];
                          const statusInfo = statusConfig[sinistro.status];
                          
                          return (
                            <TableRow key={sinistro.id}>
                              <TableCell>{format(new Date(sinistro.data), 'dd/MM/yyyy')}</TableCell>
                              <TableCell>{sinistro.placa}</TableCell>
                              <TableCell>
                                <Badge className={tipoConfig.cor}>
                                  <tipoConfig.icone className="h-3 w-3 mr-1" />
                                  {tipoConfig.texto}
                                </Badge>
                              </TableCell>
                              <TableCell>{sinistro.motorista}</TableCell>
                              <TableCell className="max-w-[200px] truncate" title={sinistro.local}>
                                {sinistro.local}
                              </TableCell>
                              <TableCell>
                                <Badge className={statusInfo.cor}>
                                  {statusInfo.texto}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col space-y-2">
                                  {sinistro.boletimOcorrenciaUrl ? (
                                    <a href={sinistro.boletimOcorrenciaUrl} target="_blank" rel="noopener noreferrer">
                                      <Button variant="outline" size="sm" className="w-full">
                                        <FileText className="h-4 w-4 mr-1" /> B.O.
                                      </Button>
                                    </a>
                                  ) : (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="w-full"
                                      onClick={() => {
                                        setSelectedSinistro(sinistro);
                                        setDocumentType('boletimOcorrencia');
                                        setUploadModalOpen(true);
                                      }}
                                    >
                                      <Upload className="h-4 w-4 mr-1" /> B.O.
                                    </Button>
                                  )}
                                  
                                  {sinistro.laudoPericial ? (
                                    <a href={sinistro.laudoPericial} target="_blank" rel="noopener noreferrer">
                                      <Button variant="outline" size="sm" className="w-full">
                                        <FileText className="h-4 w-4 mr-1" /> Laudo
                                      </Button>
                                    </a>
                                  ) : (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="w-full"
                                      onClick={() => {
                                        setSelectedSinistro(sinistro);
                                        setDocumentType('laudoPericial');
                                        setUploadModalOpen(true);
                                      }}
                                    >
                                      <Upload className="h-4 w-4 mr-1" /> Laudo
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
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
              {documentType === 'boletimOcorrencia' ? 'Anexar Boletim de Ocorrência' : 'Anexar Laudo Pericial'}
            </DialogTitle>
            <DialogDescription>
              {documentType === 'boletimOcorrencia' 
                ? 'Faça upload do Boletim de Ocorrência relacionado ao sinistro.' 
                : 'Faça upload do Laudo Pericial relacionado ao sinistro.'}
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

export default SinistrosCampinas;