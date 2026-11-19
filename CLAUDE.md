# Contexto de Magnus Company Colombia (para adjuntar en un chat de Code)

Fecha: 2026-11-19. Fuente: CLAUDE.md de SYSMOOO, propuesta de Magnus y prompt de diseño.

## Quién es el cliente
- **Magnus Company Colombia**: proveedor mayorista con más de 800 productos. Dueños (varios): "los dueños". Logo negro y rojo (una "M" con cortes rojos).
- **Quién construye:** SYSMOOO, productora/agencia 360 B2B dirigida por Juan. Nivel de servicio: **Integral 360** (Estratega, Productor y Desarrollador).
- **Proyecto:** sistema integral de ventas, bodega, reparto y equipo, más página web con recetarios y chatbot. **Ahora se trabaja solo el sistema; la web y el chatbot van después.**

## Estado
- Propuesta enviada (sin precio, sin forma de pago en el documento; se presentan en la reunión): https://sysmo-magnus-company.pages.dev (Cloudflare, noindex) y link privado de Claude https://claude.ai/artifact/Lrp6VySstFh8dWEsLh6Dyi.
- Falta: reunión, firma del contrato y primer pago. **Sin propuesta firmada no arranca ningún área.**
- Entrega **por fases**, sin plazo fijo hasta el diagnóstico (no se prometió "30 días" ni "acceso vitalicio" como a los restaurantes). Supuestos de Juan por confirmar: precio y forma de pago.
- Decisiones de Juan sobre el documento: botones sobrios, sin agenda de reunión, cierre "Esto es solo el comienzo" (se pueden construir más cosas según pidan los dueños, cotizadas antes).

## Qué se construye: 6 áreas, 18 módulos
1. **Ventas:** pantalla de vendedores; pedido en tienda (táctil); base de clientes; facturación y cobros.
2. **Bodega y catálogo:** inventario por lotes, fechas y cantidad ("primero vence, primero sale"); catálogo de 800+ productos; fotos de producto.
3. **Reparto:** domicilios; app para conductores; GPS de conductores.
4. **Equipo:** sistema para empleados; control de asistencia con foto; turnos; nómina.
5. **Dirección:** sistema general (panel del dueño); reportes para decidir.
6. **Web y atención:** sitio web con recetarios; chatbot WhatsApp y web (**fase posterior**).

Detalle de cada módulo y de las demos: `propuesta/generar-propuesta.js` (módulos desde la línea ~512) y `propuesta/interactivo.js`.

## Fases de entrega (el orden se ajusta en el diagnóstico)
- 00 Diagnóstico (el Estratega recorre bodega, ventas y reparto).
- 01 Base del sistema: catálogo 800+, inventario por lotes, clientes y panel del dueño (carga desde sus archivos actuales).
- 02 Ventas y facturación.
- 03 Reparto.
- 04 Equipo.
- 05 Web, fotos y chatbot.

## Reglas de negocio que el código debe respetar
- **Roles:** dueño/administración, vendedor, mostrador, caja, bodega, conductor, empleado. Cada uno ve solo su menú.
- **Precios y descuentos por volumen** los define la administración; el vendedor no los edita. Cada cliente tiene su lista de precios.
- **Presentaciones:** unidad, caja, paca, bulto; stock y precio por presentación.
- **Despacho por lote:** sale primero el que vence primero; trazabilidad de qué lote salió en cada venta.
- **Costos y márgenes:** no se muestran a vendedores, bodega ni conductores.
- **Acciones sensibles** (anular factura, ajustar inventario, pagar nómina): piden confirmación y quedan en el historial "quién hizo qué". La nómina pagada no se puede alterar.
- **GPS del conductor:** solo durante su turno y con aviso visible; se actualiza mientras la app esté abierta.
- **Asistencia:** entrada y salida con foto; recargos nocturnos, dominicales y festivos según la ley colombiana.
- **Factura electrónica DIAN y nómina electrónica:** con un proveedor tecnológico autorizado (se define en el diagnóstico; su costo es aparte). El sistema no emite directamente.
- **WhatsApp Business** (chatbot): requiere número verificado; el consumo lo cobra Meta.
- Moneda COP con separador de miles; fechas día/mes/año; español neutro de Colombia, sin voseo.

## Diseño
- Prompt completo para Design en `diseno-sistema/prompt-design.md`; logos en `diseno-sistema/adjuntos/` (originales en `marca/`).
- Marca de Magnus (no los colores de SYSMOOO): rojo `#D91E26` (claro `#FF5A5F`, profundo `#A3141A`), negro `#17151A` aprox., blanco. Tema claro por defecto con versión oscura. Estados con color + ícono + texto. Sin ilustraciones decorativas.
- Pie discreto "Desarrollado por SYSMOOO".

## Estándares técnicos de Juan (aplican al código)
- Código limpio y simple, pocas dependencias con versión fija, **pruebas de lo que maneja dinero, permisos o datos de personas** (precios, descuentos, facturas, cartera, nómina, roles).
- **RLS activo en toda tabla con datos de clientes.** El navegador nunca decide precios, totales ni permisos: lo valida el servidor.
- Validar y escapar toda entrada; consultas parametrizadas; sin `eval` ni HTML sin escapar.
- Cabeceras de seguridad y CSP; HTTPS siempre.
- Datos personales (empleados, clientes, conductores): pedir solo lo necesario, con aviso de privacidad (Ley 1581).
- Nunca escribir contraseñas, tokens, llaves `service_role` ni valores de `.env` en archivos o chats; solo nombres de variables. Las cuentas y claves las crea el dueño.
- **Publicar, enviar, borrar, crear cuentas o claves y escribir en producción requieren el visto bueno de Juan.**
- Verificar con evidencia (prueba, consulta o navegador) antes de dar algo por terminado.
- Sistemas internos y paneles privados llevan `noindex`.

## Referencias en el repo
- Contexto maestro de la agencia: `SYSMOOO-contexto.md` y `ecosistema/texto/`.
- Sistema de referencia por reutilizar: el de Asadicto's (`C:\Users\juanu\Downloads\ASADICTOS`, ver su CLAUDE.md y MANUAL_DE_USUARIO.md). Skill útil: `business-management-app`.
- Propuesta: `propuesta/` (generador, demos, versión Cloudflare y versión Artifact).

## Pendiente por definir (no inventar)
- Precio, forma de pago y calendario por fase.
- Stack técnico del sistema (no está decidido en el material; proponer y pedir visto bueno).
- Proveedor de factura electrónica y de nómina electrónica.
- Cuántos productos se fotografían y en qué orden.
- Cantidad de bodegas, usuarios y vehículos reales; listado de productos en Excel.
- Qué fase va primero (según lo que más duela hoy: ventas, bodega o reparto).
