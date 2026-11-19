# Puesta en marcha con Supabase

Proyecto Supabase: **MAGNUS** (`vwnagiqatzqdbjjpbqio`, región us-west-2). Migraciones 0001 a 0010 aplicadas y datos de ejemplo cargados (24 productos, 8 clientes). Son datos de muestra, no reales.

## Primer usuario (dueño)
1. En Supabase → Authentication → Users → *Add user*: correo y contraseña del dueño (la define y guarda el dueño; nunca va en el repo).
2. Dar el rol en SQL Editor:
   ```sql
   insert into public.profiles (id, full_name, role)
   select id, 'Nombre Apellido', 'dueno' from auth.users where email = 'correo@del.dueno';
   ```
3. Los demás usuarios los crea el dueño igual, con roles `vendedor`, `bodega`, `caja`, `mostrador`, `conductor` o `empleado`.

## Web
1. En `web/`: copiar `.env.example` a `.env.local` y completar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Settings → API).
2. `npm install` y `npm run dev`.

## Pendiente de configurar en el panel de Supabase
- Authentication → Passwords: activar *Leaked password protection*.
- Quitar los datos de ejemplo antes de cargar el catálogo real.

## Verificación hecha
- `supabase/tests/run.sh`: 203 pruebas sobre Postgres temporal.
- Prueba extremo a extremo sobre el proyecto real con usuarios temporales (dueño, vendedor, bodega, caja, conductor): 19 comprobaciones de permisos, costos ocultos, pedido, FEFO, factura, abono, anulación e historial. Usuarios y movimientos de prueba ya fueron eliminados.
- No se probó la interfaz web contra Supabase: este entorno no tiene salida de red hacia `*.supabase.co`.

## Variables de entorno (solo nombres; los valores los entrega el dueño)
- Siempre: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Chatbot de WhatsApp (opcional, hasta tener número verificado): `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET`, `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID`, `SITE_URL`. Sin ellas `/api/whatsapp` responde 503. En Meta, apuntar el webhook a `<SITE_URL>/api/whatsapp`.
