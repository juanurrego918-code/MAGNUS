import { supabaseServer } from './supabase/server';

/** Llama una función de la base y devuelve un mensaje en español si falla (sin detalles internos). */
export async function callRpc<T = unknown>(fn: string, args: Record<string, unknown>): Promise<{ data?: T; error?: string }> {
  const sb = await supabaseServer();
  const { data, error } = await sb.rpc(fn, args);
  if (error) {
    // Las funciones lanzan mensajes en español pensados para el usuario; los errores técnicos se ocultan.
    const friendly = error.code === 'P0001' ? error.message : 'No se pudo completar la acción. Intente de nuevo.';
    return { error: friendly };
  }
  return { data: data as T };
}
