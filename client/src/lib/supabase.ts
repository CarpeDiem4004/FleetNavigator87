import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hvsmxxqkuyjhpsiojupb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2c214eHFrdXlqaHBzaW9qdXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4MTU3MTIsImV4cCI6MjA2MDM5MTcxMn0.WzPEqHiPiS66yySX8X3H1gq1U8tedXpRSnyk-KzAFTA';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper functions for common Supabase queries

// Authentication
export const signIn = async ({ email, password }: { email: string; password: string }) => {
  return await supabase.auth.signInWithPassword({ email, password });
};

export const signUp = async ({ email, password, name }: { email: string; password: string; name: string }) => {
  // Registra o usuário na autenticação do Supabase
  const { data, error } = await supabase.auth.signUp({ 
    email, 
    password,
    options: {
      data: {
        name
      }
    }
  });
  
  if (error) {
    return { data, error };
  }
  
  // Se o registro na autenticação for bem-sucedido, cria o perfil do usuário na tabela users
  if (data.user) {
    const newUser = {
      email: data.user.email,
      name: name || data.user.email?.split('@')[0] || 'Usuário',
      role: 'operador', // Papel padrão
    };
    
    const { error: userError } = await supabase
      .from('users')
      .insert(newUser);
      
    if (userError) {
      console.error("Erro ao criar perfil do usuário:", userError);
      // Não retornamos o erro aqui para não impedir o registro,
      // já que o usuário foi criado com sucesso na autenticação
    }
  }
  
  return { data, error };
};

export const signOut = async () => {
  return await supabase.auth.signOut();
};

export const getCurrentUser = async () => {
  return await supabase.auth.getUser();
};

export const resetPassword = async (email: string) => {
  return await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/reset-password',
  });
};

// Vehicles
export const getVehicles = async (baseId?: number) => {
  let query = supabase.from('vehicles').select('*');
  
  // Apply base filter if provided
  if (baseId) {
    query = query.eq('base_id', baseId);
  }
  
  return await query;
};

export const getVehicleById = async (id: number) => {
  return await supabase.from('vehicles').select('*').eq('id', id).single();
};

export const createVehicle = async (vehicleData: any) => {
  return await supabase.from('vehicles').insert(vehicleData).select().single();
};

export const updateVehicle = async (id: number, vehicleData: any) => {
  return await supabase.from('vehicles').update(vehicleData).eq('id', id).select().single();
};

export const deleteVehicle = async (id: number) => {
  return await supabase.from('vehicles').delete().eq('id', id);
};

// Maintenance
export const getMaintenance = async () => {
  return await supabase.from('maintenance').select('*');
};

export const getMaintenanceByVehicle = async (vehiclePlate: string) => {
  return await supabase.from('maintenance').select('*').eq('vehicle_plate', vehiclePlate);
};

// Similar functions for other entities
