import { logout } from '../login/actions';

export default function SinAcceso() {
  return (
    <div className="login"><div style={{ maxWidth: 440, display: 'grid', gap: 14 }}>
      <h1>Esta sección aún no está disponible</h1>
      <p className="sub">Su rol usa la aplicación móvil, que se habilita en una fase posterior. Si cree que es un error, pídale acceso a administración.</p>
      <form action={logout}><button className="btn">Cerrar sesión</button></form>
    </div></div>
  );
}
