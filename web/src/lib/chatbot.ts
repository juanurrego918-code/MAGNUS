/** Asistente de Magnus: reglas simples y seguras (sin IA externa). Nunca inventa precios ni existencias. */
export type Reply = { text: string; links?: { label: string; href: string }[] };

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

export type Intent = 'saludo' | 'horario' | 'pedido' | 'pago' | 'domicilio' | 'contacto' | 'receta' | 'producto' | 'ayuda';

export function detectIntent(raw: string): { intent: Intent; term?: string } {
  const t = norm(raw).slice(0, 200);
  if (/^(hola|buenas|buenos dias|buen dia|buenas tardes|buenas noches|hey)\b/.test(t) && t.split(' ').length <= 4) return { intent: 'saludo' };
  if (/(horario|hora de atencion|abren|cierran|a que hora)/.test(t)) return { intent: 'horario' };
  if (/(domicilio|envio|entrega|despacho|llevan)/.test(t)) return { intent: 'domicilio' };
  if (/(pago|pagar|credito|transferencia|efectivo|factura)/.test(t)) return { intent: 'pago' };
  if (/(como (hago|pido|compro)|hacer (un )?pedido|quiero (comprar|pedir|ser cliente)|ser cliente|cliente nuevo)/.test(t)) return { intent: 'pedido' };
  if (/(telefono|contacto|asesor|hablar con|llamar|whatsapp)/.test(t)) return { intent: 'contacto' };
  const rec = t.match(/(?:receta|preparar|cocinar|como hacer)\s+(?:de |del |la |el |una |un )?(.+)/);
  if (rec) return { intent: 'receta', term: rec[1].slice(0, 40) };
  const prod = t.match(/(?:tienen|hay|venden|precio de|busco|necesito|quiero)\s+(?:de |del |la |el |una |un |unos |unas )?(.+)/);
  if (prod) return { intent: 'producto', term: prod[1].replace(/[?¿!¡.]/g, '').slice(0, 40) };
  if (/(receta)/.test(t)) return { intent: 'receta' };
  return { intent: 'ayuda' };
}

export const FIXED: Record<'saludo' | 'horario' | 'pedido' | 'pago' | 'domicilio' | 'contacto' | 'ayuda', Reply> = {
  saludo: { text: '¡Hola! Soy el asistente de Magnus. Puedo ayudarle con productos, recetas, domicilios y cómo hacer su pedido. ¿Qué necesita?' },
  horario: { text: 'Un asesor le confirmará el horario de atención. Déjenos su contacto y le escribimos.', links: [{ label: 'Dejar mi contacto', href: '/contacto' }] },
  pedido: { text: 'Para comprar como cliente mayorista, déjenos su nombre y teléfono. Un asesor le crea su usuario y su lista de precios.', links: [{ label: 'Quiero ser cliente', href: '/contacto' }] },
  pago: { text: 'Manejamos contado, crédito (según cada cliente) y contra entrega en domicilios. Las condiciones las define un asesor al crear su cuenta.', links: [{ label: 'Hablar con un asesor', href: '/contacto' }] },
  domicilio: { text: 'Hacemos domicilios con ventanas de entrega de 8 a 11, de 11 a 2 y de 2 a 5. Si ya tiene un pedido, use el enlace de seguimiento que le enviamos.' },
  contacto: { text: 'Con gusto lo atiende un asesor. Déjenos su nombre y teléfono.', links: [{ label: 'Dejar mi contacto', href: '/contacto' }] },
  ayuda: { text: 'No estoy seguro de haber entendido. Puede preguntarme por un producto (ej. "tienen arroz"), una receta (ej. "receta de arroz"), domicilios o cómo hacer un pedido.' },
};

export function productReply(term: string, found: { name: string; brand: string | null }[]): Reply {
  if (!found.length) return { text: `No encontré "${term}" en el catálogo. Un asesor puede ayudarle a buscarlo.`, links: [{ label: 'Hablar con un asesor', href: '/contacto' }] };
  const list = found.slice(0, 5).map((p) => `• ${p.name}${p.brand ? ` (${p.brand})` : ''}`).join('\n');
  return { text: `Sí manejamos:\n${list}\nLos precios son por lista de cliente; un asesor se los confirma.`, links: [{ label: 'Ver catálogo', href: '/productos' }, { label: 'Quiero ser cliente', href: '/contacto' }] };
}

export function recipeReply(term: string | undefined, found: { slug: string; title: string }[]): Reply {
  if (!found.length) return { text: term ? `Aún no tenemos una receta de "${term}".` : 'Todavía no hay recetas publicadas.', links: [{ label: 'Ver recetas', href: '/recetas' }] };
  return { text: 'Encontré estas recetas:', links: found.slice(0, 4).map((r) => ({ label: r.title, href: `/recetas/${r.slug}` })) };
}
