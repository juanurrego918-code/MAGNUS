import { redirect } from 'next/navigation';
import { supabaseServer } from './supabase/server';
import { canSee, homeFor, type Role } from './roles';

export type Session = { id: string; name: string; role: Role };

/** Devuelve el usuario con su rol o lo manda a /login. El rol sale de la base de datos, no del navegador. */
export async function requireSession(path?: string): Promise<Session> {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await sb.from('profiles').select('full_name, role, active').eq('id', user.id).single();
  if (!profile || !profile.active) redirect('/login?error=sin-perfil');
  const role = profile.role as Role;
  if (path && !canSee(role, path)) redirect(homeFor(role));
  return { id: user.id, name: profile.full_name, role };
}
