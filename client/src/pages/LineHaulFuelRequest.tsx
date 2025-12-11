import { useState } from "react";
import { getSupabaseClient } from "@/lib/supabase-compat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Fuel, Camera, Check, Truck, MapPin, Phone, User, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function LineHaulFuelRequest() {
  const { toast } = useToast();
  const supabase = getSupabaseClient();
  
  const [form, setForm] = useState({
    nome: "",
    telefone: "",
    placa: "",
    localInicio: "",
    destino: "",
    horarioAbastecimento: "",
    provedorCartao: "veloe" as "veloe" | "ticket",
  });

  const [fotoPainel, setFotoPainel] = useState<File | null>(null);
  const [fotoCartao, setFotoCartao] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function uploadImage(file: File, path: string): Promise<string | null> {
    try {
      const { data, error } = await supabase.storage
        .from("linehaul_uploads")
        .upload(path, file, { upsert: true });

      if (error) {
        console.error("Erro no upload:", error);
        return null;
      }

      const { data: urlData } = supabase.storage
        .from("linehaul_uploads")
        .getPublicUrl(path);

      return urlData?.publicUrl || null;
    } catch (err) {
      console.error("Erro ao fazer upload:", err);
      return null;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      let painelUrl: string | null = null;
      let cartaoUrl: string | null = null;

      const timestamp = Date.now();
      const plateClean = form.placa.replace(/\s/g, "").toUpperCase();

      if (fotoPainel) {
        painelUrl = await uploadImage(
          fotoPainel,
          `painel_${plateClean}_${timestamp}.jpg`
        );
      }

      if (fotoCartao) {
        cartaoUrl = await uploadImage(
          fotoCartao,
          `cartao_${plateClean}_${timestamp}.jpg`
        );
      }

      const { error } = await supabase
        .from("linehaul_abastecimento_solicitacoes")
        .insert([
          {
            nome_motorista: form.nome,
            telefone: form.telefone,
            placa_veiculo: plateClean,
            local_inicio: form.localInicio,
            destino: form.destino,
            horario_abastecimento: form.horarioAbastecimento,
            provedor_cartao: form.provedorCartao,
            foto_painel_url: painelUrl,
            foto_cartao_url: cartaoUrl,
            status: "pendente",
          },
        ]);

      if (error) throw error;

      toast({
        title: "Solicitação enviada!",
        description: "Sua solicitação de abastecimento foi registrada com sucesso.",
      });

      setSubmitted(true);
    } catch (err: any) {
      console.error("Erro ao enviar:", err);
      toast({
        title: "Erro ao enviar",
        description: err.message || "Ocorreu um erro ao enviar a solicitação.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Solicitação Enviada!
            </h2>
            <p className="text-gray-600 mb-6">
              Sua solicitação de abastecimento foi registrada com sucesso.
            </p>
            <Button 
              onClick={() => {
                setSubmitted(false);
                setForm({
                  nome: "",
                  telefone: "",
                  placa: "",
                  localInicio: "",
                  destino: "",
                  horarioAbastecimento: "",
                  provedorCartao: "veloe",
                });
                setFotoPainel(null);
                setFotoCartao(null);
              }}
              className="w-full"
              data-testid="button-new-request"
            >
              Nova Solicitação
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 p-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-full mb-4">
            <Fuel className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">
            Solicitação de Abastecimento
          </h1>
          <p className="text-blue-200 mt-1">Line Haul</p>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Dados da Solicitação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Nome do Motorista
                </Label>
                <Input
                  id="nome"
                  type="text"
                  placeholder="Digite seu nome completo"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  required
                  data-testid="input-driver-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Telefone
                </Label>
                <Input
                  id="telefone"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={form.telefone}
                  onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                  required
                  data-testid="input-phone"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="placa" className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Placa do Veículo
                </Label>
                <Input
                  id="placa"
                  type="text"
                  placeholder="ABC1D23"
                  value={form.placa}
                  onChange={(e) => setForm({ ...form, placa: e.target.value.toUpperCase() })}
                  required
                  maxLength={7}
                  data-testid="input-plate"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="localInicio" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Local de Início
                </Label>
                <Input
                  id="localInicio"
                  type="text"
                  placeholder="Cidade/Estado de partida"
                  value={form.localInicio}
                  onChange={(e) => setForm({ ...form, localInicio: e.target.value })}
                  required
                  data-testid="input-origin"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="destino" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Destino
                </Label>
                <Input
                  id="destino"
                  type="text"
                  placeholder="Cidade/Estado de destino"
                  value={form.destino}
                  onChange={(e) => setForm({ ...form, destino: e.target.value })}
                  required
                  data-testid="input-destination"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="horario" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Horário Previsto do Abastecimento
                </Label>
                <Input
                  id="horario"
                  type="datetime-local"
                  value={form.horarioAbastecimento}
                  onChange={(e) => setForm({ ...form, horarioAbastecimento: e.target.value })}
                  required
                  data-testid="input-datetime"
                />
              </div>

              <div className="space-y-3 pt-2">
                <Label className="flex items-center gap-2 text-base font-semibold">
                  <Fuel className="h-4 w-4" />
                  Tipo de Cartão
                </Label>
                <RadioGroup
                  value={form.provedorCartao}
                  onValueChange={(value: "veloe" | "ticket") => 
                    setForm({ ...form, provedorCartao: value })
                  }
                  className="grid grid-cols-2 gap-4"
                >
                  <div className="relative">
                    <RadioGroupItem
                      value="veloe"
                      id="veloe"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="veloe"
                      className="flex flex-col items-center justify-center rounded-lg border-2 border-gray-200 bg-white p-4 hover:bg-gray-50 peer-data-[state=checked]:border-blue-600 peer-data-[state=checked]:bg-blue-50 cursor-pointer transition-all"
                      data-testid="radio-veloe"
                    >
                      <span className="text-lg font-bold text-blue-600">VELOE</span>
                      <span className="text-xs text-gray-500 mt-1">Cartão Veloe</span>
                    </Label>
                  </div>
                  <div className="relative">
                    <RadioGroupItem
                      value="ticket"
                      id="ticket"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="ticket"
                      className="flex flex-col items-center justify-center rounded-lg border-2 border-gray-200 bg-white p-4 hover:bg-gray-50 peer-data-[state=checked]:border-orange-600 peer-data-[state=checked]:bg-orange-50 cursor-pointer transition-all"
                      data-testid="radio-ticket"
                    >
                      <span className="text-lg font-bold text-orange-600">TICKET</span>
                      <span className="text-xs text-gray-500 mt-1">Cartão Ticket</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2 pt-2">
                <Label className="flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Foto do Painel (Km)
                </Label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => setFotoPainel(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    data-testid="input-photo-panel"
                    id="foto-painel"
                  />
                  <div className={`flex items-center justify-center gap-3 p-4 rounded-lg border-2 border-dashed transition-all ${fotoPainel ? 'border-green-500 bg-green-50' : 'border-blue-300 bg-blue-50 hover:bg-blue-100'}`}>
                    <Camera className={`h-8 w-8 ${fotoPainel ? 'text-green-600' : 'text-blue-600'}`} />
                    <div className="text-left">
                      <p className={`font-semibold ${fotoPainel ? 'text-green-700' : 'text-blue-700'}`}>
                        {fotoPainel ? 'Foto capturada!' : 'Tirar Foto do Painel'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {fotoPainel ? fotoPainel.name : 'Toque para abrir a câmera'}
                      </p>
                    </div>
                    {fotoPainel && <Check className="h-6 w-6 text-green-600" />}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Foto do Cartão
                </Label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => setFotoCartao(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    data-testid="input-photo-card"
                    id="foto-cartao"
                  />
                  <div className={`flex items-center justify-center gap-3 p-4 rounded-lg border-2 border-dashed transition-all ${fotoCartao ? 'border-green-500 bg-green-50' : 'border-orange-300 bg-orange-50 hover:bg-orange-100'}`}>
                    <Camera className={`h-8 w-8 ${fotoCartao ? 'text-green-600' : 'text-orange-600'}`} />
                    <div className="text-left">
                      <p className={`font-semibold ${fotoCartao ? 'text-green-700' : 'text-orange-700'}`}>
                        {fotoCartao ? 'Foto capturada!' : 'Tirar Foto do Cartão'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {fotoCartao ? fotoCartao.name : 'Toque para abrir a câmera'}
                      </p>
                    </div>
                    {fotoCartao && <Check className="h-6 w-6 text-green-600" />}
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full mt-6 h-12 text-lg"
                disabled={loading}
                data-testid="button-submit"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Fuel className="mr-2 h-5 w-5" />
                    Enviar Solicitação
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-blue-200 text-sm mt-4">
          Line Haul - Gestão de Frota
        </p>
      </div>
    </div>
  );
}
