# Fase 03 · Reparto

## Qué incluye
- `supabase/migrations/0005_reparto.sql`: entregas (se crean solas con cada pedido a domicilio), turnos del conductor, ubicaciones, asignación, evidencia, novedades, cobro contra entrega y enlace de seguimiento.
- `supabase/migrations/0006_storage.sql`: bucket privado `evidencias` (fotos). El conductor sube solo a su carpeta; el dueño las lee.
- `supabase/tests/03_fase03.sql`: 45 pruebas (118 en total).
- Web: `/turno` y `/entregas` (conductor, botones grandes), `/domicilios` (dueño: asignar conductor y orden, ver conductores en turno y su última ubicación) y `/seguimiento/<enlace>` (público, para el cliente).

## Reglas que cumple
- El GPS solo se registra con turno abierto, con aviso fijo visible y se apaga al terminar el turno. Máximo un punto cada 5 s.
- Sin turno el conductor no puede cargar, salir ni entregar. Solo ve y opera sus propias entregas, sin precios.
- Entregar exige foto, nombre de quien recibe (3+ caracteres) y, si hay cobro, el medio. No se puede entregar dos veces.
- El enlace de seguimiento muestra estado y ventana de entrega; nunca ubicación, montos ni conductor.
- Todo queda en el historial (turno, asignación, entrega, novedad).

## Decisiones tomadas (confirmar con Juan)
- Solo se asigna a conductores con turno abierto (los demás aparecen deshabilitados).
- Si caja factura **después** de entregar un pedido contra entrega, el pago no se registra solo; caja debe abonarlo. Con la factura ya emitida, la entrega salda la cartera automáticamente.
- Una novedad se reasigna desde `/domicilios` y vuelve a "Por alistar".
- Los puntos de GPS no se borran automáticamente; falta definir cuánto tiempo se conservan (Ley 1581).

## Pendiente de Fase 03
- Mapa con pines y recorrido (proveedor de mapas por definir; hoy hay enlace a Google Maps).
- Firma con el dedo (la base ya acepta la ruta, la pantalla no la captura).
- Envío del enlace de seguimiento al cliente por WhatsApp (depende del chatbot, Fase 05).
- Probar las pantallas con un navegador real y un celular: este entorno no llega a Supabase.
