# Fase 01 · Base del sistema

## Qué incluye
- `supabase/migrations/0001_base.sql`: roles, catálogo, presentaciones, listas de precios, descuentos por volumen, lotes (FEFO), clientes e historial inalterable. RLS en todas las tablas.
- `supabase/seed.sql`: datos de ejemplo del diseño (24 productos, 8 clientes). Se regenera con `node supabase/scripts/gen-seed.cjs`. **No cargar en producción.**
- `supabase/tests/`: 29 pruebas de permisos, costos ocultos, precios, descuentos, FEFO, ajustes e historial. Correr: `supabase/tests/run.sh` (usa un Postgres temporal).
- `web/`: Next.js 15 + Supabase. Pantallas: login, panel del dueño, catálogo, inventario por lotes, clientes, historial.
- `docs/diseno-referencia/`: prototipos HTML del diseño (solo referencia).

## Para ponerlo a funcionar con Supabase (requiere visto bueno de Juan)
1. El dueño crea el proyecto de Supabase y entrega URL y llave pública (anon).
2. Aplicar `0001_base.sql` (y `seed.sql` solo en un proyecto de pruebas).
3. Crear los usuarios en Auth y su fila en `profiles` con el rol.
4. En `web/`: copiar `.env.example` a `.env.local` con los valores; `npm install`; `npm run dev`.

## Pendiente de Fase 01
- Cargar el catálogo real desde el Excel del cliente (carga masiva con revisión).
- Pantallas de edición (alta/edición de producto, recepción y ajuste desde la web); hoy las reglas ya existen en la base (`receive_lot`, `adjust_inventory`).
- Subir Next a 16.4.6 para cerrar un aviso de `postcss` en tiempo de compilación (no afecta ejecución).
