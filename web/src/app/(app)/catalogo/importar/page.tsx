import { requireSession } from '@/lib/session';
import { ImportForm } from './form';

export default async function Importar() {
  const s = await requireSession('/catalogo');
  if (s.role !== 'dueno') return <div className="card empty">Solo administración puede cargar el catálogo.</div>;
  return (<>
    <h1>Carga masiva de catálogo</h1>
    <p className="sub">Desde el Excel actual guardado como CSV. Se revisa antes de importar.</p>
    <ImportForm />
  </>);
}
