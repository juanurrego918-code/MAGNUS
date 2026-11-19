'use server';
import { anonClient } from '@/lib/answer';

export type Estado = { ok?: boolean; error?: string } | undefined;

export async function enviarContacto(_: Estado, form: FormData): Promise<Estado> {
  if (String(form.get('website') ?? '') !== '') return { ok: true }; // campo trampa para bots
  const { error } = await anonClient().rpc('submit_lead', {
    p_name: String(form.get('name') ?? '').slice(0, 80), p_phone: String(form.get('phone') ?? '').slice(0, 30), p_message: String(form.get('message') ?? '').slice(0, 500),
  });
  if (error) return { error: error.code === 'P0001' ? error.message : 'No se pudo enviar. Intente de nuevo.' };
  return { ok: true };
}
