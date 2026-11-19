import { SiteShell } from '@/components/SiteShell';
import { ContactForm } from './form';

export const metadata = { title: 'Contacto · Magnus' };
export default function Contacto() {
  return (<SiteShell><h1>Quiero ser cliente</h1><p className="sub">Déjenos sus datos y un asesor le crea su usuario y su lista de precios.</p><ContactForm /></SiteShell>);
}
