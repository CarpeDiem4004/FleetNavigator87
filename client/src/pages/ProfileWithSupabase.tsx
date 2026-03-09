import React, { useState } from 'react';
import { useSupabaseAuthContext } from '@/context/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, LogOut, User, Mail, UserCog } from 'lucide-react';
import { useLocation } from 'wouter';

export default function ProfileWithSupabase() {
  const { user, supabaseUser, isLoading, logout } = useSupabaseAuthContext();
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      toast({
        title: "Logout realizado com sucesso",
        description: "Você foi desconectado do sistema",
      });
      navigate('/login-supabase');
    } catch (error: any) {
      toast({
        title: "Erro ao fazer logout",
        description: error.message || "Ocorreu um erro ao tentar sair do sistema",
        variant: "destructive",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user && !supabaseUser) {
    navigate('/login-supabase');
    return null;
  }

  const userInitials = user?.name 
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() 
    : supabaseUser?.email?.substring(0, 2).toUpperCase() || 'U';

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={supabaseUser?.user_metadata?.avatar_url} />
              <AvatarFallback className="text-2xl">{userInitials}</AvatarFallback>
            </Avatar>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Perfil do Usuário</CardTitle>
          <CardDescription className="text-center">
            Gerencie suas informações de conta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-3 p-3 bg-gray-100 rounded-md">
            <User className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-sm font-medium">Nome</p>
              <p>{user?.name || supabaseUser?.user_metadata?.name || 'Não informado'}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-gray-100 rounded-md">
            <Mail className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-sm font-medium">E-mail</p>
              <p>{user?.email || supabaseUser?.email}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-gray-100 rounded-md">
            <UserCog className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-sm font-medium">Função</p>
              <p className="capitalize">{user?.role || supabaseUser?.user_metadata?.role || 'Usuário'}</p>
            </div>
          </div>

          {user?.baseId && (
            <div className="flex items-center space-x-3 p-3 bg-gray-100 rounded-md">
              <div>
                <p className="text-sm font-medium">Base</p>
                <p>{user.basename || `Base #${user.baseId}`}</p>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button 
            onClick={handleLogout} 
            variant="outline" 
            className="w-full"
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saindo...
              </>
            ) : (
              <>
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}