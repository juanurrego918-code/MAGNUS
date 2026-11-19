import { SiteShell } from '@/components/SiteShell';

export const metadata = { title: 'Aviso de privacidad · Magnus' };
export default function Privacidad() {
  return (
    <SiteShell>
      <h1>Aviso de privacidad</h1>
      <div style={{ display: 'grid', gap: 12, maxWidth: 720 }}>
        <p>Magnus Company Colombia trata datos personales conforme a la Ley 1581 de 2012. Este aviso es un borrador pendiente de revisión jurídica.</p>
        <h2 className="sec">Qué datos pedimos y para qué</h2>
        <ul>
          <li><b>Contacto del sitio:</b> nombre, teléfono y mensaje, solo para que un asesor lo contacte.</li>
          <li><b>Clientes:</b> datos del negocio y contacto, para vender, facturar y entregar.</li>
          <li><b>Empleados:</b> datos laborales, asistencia con foto y nómina, para gestionar el trabajo y los pagos.</li>
          <li><b>Conductores:</b> ubicación solo durante el turno y con aviso visible; se conserva 7 días.</li>
        </ul>
        <h2 className="sec">Sus derechos</h2>
        <p>Puede conocer, actualizar, rectificar y solicitar la supresión de sus datos, y revocar su autorización, escribiendo a Magnus por los canales de contacto del sitio.</p>
        <p className="muted">Responsable: Magnus Company Colombia. Desarrollado por SYSMOOO.</p>
      </div>
    </SiteShell>);
}
