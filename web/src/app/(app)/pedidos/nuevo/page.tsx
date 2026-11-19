import { requireSession } from '@/lib/session';
import { supabaseServer } from '@/lib/supabase/server';
import { NuevoPedido } from './form';

export default async function Nuevo() {
  await requireSession('/pedidos');
  const sb = await supabaseServer();
  const [clients, prods] = await Promise.all([
    sb.from('clients').select('id, name, credit_days').eq('active', true).order('name'),
    sb.from('products').select('id, name, code, presentations(id, name, price)').eq('active', true).order('name').limit(500),
  ]);
  return (<>
    <h1>Nuevo pedido</h1>
    <p className="sub">Escriba la cantidad en cada presentación. Los precios y el descuento por volumen los calcula el sistema.</p>
    <NuevoPedido clients={clients.data ?? []} products={(prods.data ?? []) as never} />
  </>);
}
