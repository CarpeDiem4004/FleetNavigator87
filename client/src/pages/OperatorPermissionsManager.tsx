import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Wrench, BarChart4, Building2, Package, FileText, KeyRound,
  Activity, Gauge, Truck, Users, CircleDot, CreditCard, Fuel,
  ShieldAlert, Save, Loader2, UserCog, Eye, EyeOff, Unlock, Lock,
  ChevronDown, ChevronRight, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem
} from "@/components/ui/select";

const ICON_MAP: Record<string, any> = {
  Wrench, BarChart4, Building2, Package, FileText, KeyRound,
  Activity, Gauge, Truck, Users, CircleDot, CreditCard, Fuel, ShieldAlert
};

const CATEGORY_LABELS: Record<string, string> = {
  manutencao: "Manutenção",
  frota: "Frota",
  outros: "Outros",
};

interface OperatorUser {
  id: number;
  name: string;
  email: string;
  basename: string | null;
  is_active: boolean;
}

interface CardPermission {
  id: string;
  name: string;
  description: string;
  icon: string;
  href: string;
  category: string;
  color: string;
  sort_order: number;
  can_view: boolean;
  can_access: boolean;
}

export default function OperatorPermissionsManager() {
  const { toast } = useToast();
  const [users, setUsers] = useState<OperatorUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [permissions, setPermissions] = useState<CardPermission[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingPerms, setLoadingPerms] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    manutencao: true, frota: true, outros: true
  });

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (selectedUserId) loadPermissions(selectedUserId);
  }, [selectedUserId]);

  const loadUsers = async () => {
    try {
      const res = await apiRequest("GET", "/api/operator-frota/users");
      const data = await res.json();
      if (data.success) setUsers(data.data);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadPermissions = async (userId: string) => {
    setLoadingPerms(true);
    try {
      const res = await apiRequest("GET", `/api/operator-card-permissions/${userId}`);
      const data = await res.json();
      if (data.success) setPermissions(data.data);
    } finally {
      setLoadingPerms(false);
    }
  };

  const togglePermission = (cardId: string, field: "can_view" | "can_access", value: boolean) => {
    setPermissions(prev => prev.map(p => {
      if (p.id !== cardId) return p;
      if (field === "can_view" && !value) {
        return { ...p, can_view: false, can_access: false };
      }
      if (field === "can_access" && value) {
        return { ...p, can_view: true, can_access: true };
      }
      return { ...p, [field]: value };
    }));
  };

  const toggleAll = (category: string, enable: boolean) => {
    setPermissions(prev => prev.map(p =>
      p.category === category ? { ...p, can_view: enable, can_access: enable } : p
    ));
  };

  const savePermissions = async () => {
    if (!selectedUserId) return;
    setSaving(true);
    try {
      const payload = permissions.map(p => ({
        cardId: p.id,
        canView: p.can_view,
        canAccess: p.can_access,
      }));
      const res = await apiRequest("PUT", `/api/operator-card-permissions/${selectedUserId}`, { permissions: payload });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Permissões salvas", description: "Configurações atualizadas com sucesso." });
      } else {
        toast({ title: "Erro", description: data.message, variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro", description: "Falha ao salvar permissões.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const selectedUser = users.find(u => u.id.toString() === selectedUserId);

  const groupedCards = permissions.reduce<Record<string, CardPermission[]>>((acc, card) => {
    const cat = card.category || "outros";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(card);
    return acc;
  }, {});

  const enabledCount = permissions.filter(p => p.can_view).length;
  const accessCount = permissions.filter(p => p.can_access).length;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <UserCog className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold text-gray-900">Permissões de Operador de Frota</h1>
        </div>
        <p className="text-sm text-gray-500 ml-9">
          Configure quais módulos cada operador pode visualizar e acessar.
        </p>
      </div>

      {/* User selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <Label className="text-sm font-medium text-gray-700 mb-2 block">Selecionar operador</Label>
        {loadingUsers ? (
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Carregando usuários...
          </div>
        ) : users.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhum operador de frota cadastrado.</p>
        ) : (
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger className="w-full max-w-sm">
              <SelectValue placeholder="Escolha um operador..." />
            </SelectTrigger>
            <SelectContent>
              {users.map(u => (
                <SelectItem key={u.id} value={u.id.toString()}>
                  <div className="flex items-center gap-2">
                    <span>{u.name}</span>
                    {!u.is_active && <Badge variant="outline" className="text-xs text-red-500">Inativo</Badge>}
                    {u.basename && <span className="text-xs text-gray-400">— {u.basename}</span>}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Permissions editor */}
      {selectedUserId && (
        <>
          {loadingPerms ? (
            <div className="flex items-center justify-center py-12 gap-3 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Carregando permissões...</span>
            </div>
          ) : (
            <>
              {/* Summary bar */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <Eye className="w-4 h-4 text-blue-500" />
                    <span><strong>{enabledCount}</strong> visíveis</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <Unlock className="w-4 h-4 text-green-500" />
                    <span><strong>{accessCount}</strong> acessíveis</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <Lock className="w-4 h-4 text-gray-400" />
                    <span><strong>{permissions.length - enabledCount}</strong> ocultos</span>
                  </div>
                </div>

                <Button onClick={savePermissions} disabled={saving} size="sm" className="gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? "Salvando..." : "Salvar"}
                </Button>
              </div>

              {/* Cards by category */}
              {Object.entries(groupedCards).map(([category, catCards]) => {
                const allEnabled = catCards.every(c => c.can_view && c.can_access);
                const allDisabled = catCards.every(c => !c.can_view);
                const isExpanded = expandedCategories[category] !== false;

                return (
                  <div key={category} className="bg-white rounded-xl border border-gray-200 mb-4 overflow-hidden">
                    {/* Category header */}
                    <div
                      className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200 cursor-pointer"
                      onClick={() => setExpandedCategories(prev => ({ ...prev, [category]: !isExpanded }))}
                    >
                      <div className="flex items-center gap-2">
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                        <span className="font-semibold text-sm text-gray-700">
                          {CATEGORY_LABELS[category] || category}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {catCards.filter(c => c.can_view).length}/{catCards.length}
                        </Badge>
                      </div>
                      <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                        <Button
                          size="sm" variant="outline" className="h-6 text-xs px-2 text-green-600 border-green-200"
                          onClick={() => toggleAll(category, true)}
                        >
                          Habilitar todos
                        </Button>
                        <Button
                          size="sm" variant="outline" className="h-6 text-xs px-2 text-red-600 border-red-200"
                          onClick={() => toggleAll(category, false)}
                        >
                          Desabilitar todos
                        </Button>
                      </div>
                    </div>

                    {/* Card rows */}
                    {isExpanded && (
                      <div className="divide-y divide-gray-100">
                        {catCards.map(card => {
                          const IconComp = ICON_MAP[card.icon] || Wrench;
                          return (
                            <div key={card.id} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors">
                              {/* Icon */}
                              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                <IconComp className="w-4 h-4 text-gray-500" />
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800">{card.name}</p>
                                {card.description && (
                                  <p className="text-xs text-gray-400 truncate">{card.description}</p>
                                )}
                              </div>

                              {/* Toggles */}
                              <div className="flex items-center gap-6 flex-shrink-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-500 w-14 text-right">Visível</span>
                                  <Switch
                                    checked={card.can_view}
                                    onCheckedChange={v => togglePermission(card.id, "can_view", v)}
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-500 w-16 text-right">Acessível</span>
                                  <Switch
                                    checked={card.can_access}
                                    disabled={!card.can_view}
                                    onCheckedChange={v => togglePermission(card.id, "can_access", v)}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Bottom save */}
              <div className="flex justify-end pt-2">
                <Button onClick={savePermissions} disabled={saving} className="gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {saving ? "Salvando..." : "Salvar permissões"}
                </Button>
              </div>
            </>
          )}
        </>
      )}

      {!selectedUserId && !loadingUsers && users.length > 0 && (
        <div className="text-center py-16 text-gray-400">
          <UserCog className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Selecione um operador para gerenciar seus acessos.</p>
        </div>
      )}
    </div>
  );
}
