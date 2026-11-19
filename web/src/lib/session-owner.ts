import { supabaseServer } from './supabase/server';

/** Para rutas API: devuelve true solo si hay sesión y el rol es dueño (según la base de datos). */
export async function isOwnerRequest(): Promise<boolean> {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return false;
  const { data } = await sb.from('profiles').select('role, active').eq('id', user.id).single();
  return !!data && data.active && data.role === 'dueno';
}
