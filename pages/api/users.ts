import { supabase } from './supabaseClient';

export const getUsers = async () => {
  const { data, error } = await supabase
    .from('usuario')
    .select('id, name, email, role, baseId');

  if (error) {
    console.error('Erro ao buscar usuários:', error);
    throw new Error('Não foi possível buscar os usuários.');
  }

  return data;
};
