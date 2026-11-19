# Fase 02 · Ventas y facturación

## Qué incluye
- `supabase/migrations/0002_ventas.sql`: pedidos, líneas, trazabilidad por lote, facturas, abonos, cuadre de caja, cartera y cola de bodega (sin precios).
- Funciones del servidor: `create_order`, `pick_order` (FEFO), `invoice_order`, `register_payment`, `annul_invoice`, `close_cash`. El navegador solo manda producto y cantidad; precios, descuento y totales los calcula la base.
- `supabase/tests/02_fase02.sql`: 44 pruebas (73 en total con la Fase 01).
- Web: `/pedidos` y `/pedidos/nuevo` (vendedor), `/alistar` (bodega), `/caja` (cobrar, cartera, abonos, anulación y cuadre).

## Decisiones tomadas (confirmar con Juan)
- Un pedido no se puede enviar si supera las existencias (el prototipo solo avisaba).
- **Anular una factura NO devuelve el inventario**: queda por definir con bodega cómo se reingresa.
- El estado DIAN queda en `pendiente`: el envío depende del proveedor tecnológico, aún sin definir.
- El pedido de mostrador (táctil) ya existe en la base (`create_order` con canal `mostrador`), pero su pantalla no está hecha.

## Pendiente de Fase 02
- Pantalla táctil de mostrador, cotizaciones, remisión/PDF de factura, reportes para el contador.
- Probar las pantallas con un proyecto Supabase real (hoy solo está probada la base de datos).
