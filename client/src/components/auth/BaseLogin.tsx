/**
 * Componente genérico de login para bases
 * Pode ser usado por qualquer base com customização de nome e cor
 */

import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  LogIn, 
  MapPin, 
  ArrowLeft, 
  Eye, 
  EyeOff,
  Clock,
  Shield
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface BaseLoginProps {
  baseId: number;
  baseName?: string;
  primaryColor?: string;
  onSuccess?: () => void;
}

interface Base {
  id: number;
  name: string;
  location: string;
  operation: string;
  type: string;
  active: boolean;
}

export default function BaseLogin({ baseId, baseName, primaryColor = '#2563eb', onSuccess }: BaseLoginProps) {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Buscar dados da base
  const { data: base } = useQuery<Base>({
    queryKey: ['/api/bases', baseId],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/bases/${baseId}`);
      const data = await res.json();
      return data.data;
    },
    enabled: !baseName,
  });

  const finalBaseName = baseName || base?.name || 'Base';
  const baseLocation = base?.location || '';
  const baseOperation = base?.operation || '';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await apiRequest('POST', '/api/auth/login', {
        email,
        password,
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        
        if (onSuccess) {
          onSuccess();
        } else {
          setLocation(`/bases/${baseId}`);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Erro ao fazer login');
      }
    } catch (error) {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentTime = () => {
    return new Date().toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-center">
            <Building2 className="h-12 w-12 mb-2" style={{ color: primaryColor }} />
          </div>
          
          <div className="text-center space-y-2">
            <CardTitle className="text-2xl font-bold">
              {finalBaseName}
            </CardTitle>
            
            {baseLocation && (
              <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{baseLocation}</span>
              </div>
            )}
            
            {baseOperation && (
              <Badge variant="outline" className="text-xs">
                {baseOperation}
              </Badge>
            )}
          </div>
          
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Faça login para acessar o sistema
            </p>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              style={{ backgroundColor: primaryColor }}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Entrando...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  Entrar
                </>
              )}
            </Button>
          </form>
          
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{getCurrentTime()}</span>
              </div>
              <div className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                <span>Seguro</span>
              </div>
            </div>
          </div>
          
          <div className="text-center pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/login')}
              className="gap-2 text-xs"
            >
              <ArrowLeft className="h-3 w-3" />
              Voltar ao sistema principal
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}