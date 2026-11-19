# Fase 05 y pendientes de las fases anteriores

## Qué se agregó (todo sobre migraciones 0009 y 0010; 203 pruebas de base de datos en total)
- **Mostrador táctil** (`/mostrador`, rol mostrador): bienvenida, categorías, productos con foto, pedido, número de turno y regreso a la bienvenida tras 60 s sin tocar. El total final lo calcula el servidor.
- **Cotizaciones** (`/cotizaciones`: caja, vendedor y dueño): precios de la lista del cliente, vigencia, y conversión a pedido con precios vigentes (una sola vez, y no vencida).
- **Reportes** (`/reportes`, solo dueño): por producto (ingreso, costo y margen), por cliente, por vendedor (comisión 2 %) y qué reponer, con exportación a CSV. **Nómina para el contador** en CSV desde `/nomina`.
- **Catálogo**: edición de producto (precios, costo, mínimo, activo y foto) con historial de cambios de precio; carga masiva desde CSV con revisión previa (válidos, advertencias, rechazados) antes de importar.
- **Inventario**: pantallas para recibir mercancía y para ajustes o merma con confirmación.
- **Sitio público**: inicio, catálogo sin precios, recetas, contacto (con tope anti-spam) y aviso de privacidad. El dueño gestiona recetas y ve los contactos en `/sitio`.
- **Asistente**: widget en el sitio y webhook de WhatsApp (`/api/whatsapp`, con verificación de firma de Meta). Responde con reglas sobre datos públicos: nunca inventa precios ni existencias y deriva a un asesor.

## Decisiones tomadas (sin consultar, por instrucción de Juan; todas reversibles)
- El sitio sigue con `noindex` hasta el lanzamiento (quitar la cabecera en `next.config.ts` y el metadato en `layout.tsx`).
- El asistente es de reglas, no de IA: es predecible y no requiere llaves. Se puede cambiar por un modelo de lenguaje después.
- Una anulación de factura sigue sin reingresar inventario (pendiente con bodega).
- Conservación: GPS 7 días (purga automática). Fotos de asistencia y de entrega: sin purga automática todavía (los archivos requieren la API de Storage); plazo sugerido 90 días, por confirmar.
- Textos legales (aviso de privacidad) son borrador y necesitan revisión jurídica.

## Pendiente real
- Número de WhatsApp verificado y sus credenciales (Meta cobra el consumo).
- Fotos de producto (subir desde `/catalogo/<id>`) y recetas reales.
- Proveedor de factura y nómina electrónica ante la DIAN; remisión/PDF de factura con su formato final.
- Mapa de conductores con proveedor definido; cuadrícula semanal de turnos; firma con el dedo.
- Probar todas las pantallas en un navegador contra el Supabase real: este entorno no tiene salida de red hacia `*.supabase.co`.
