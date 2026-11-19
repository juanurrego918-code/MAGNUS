# Prompt para Design · Sistema completo de Magnus Company Colombia

Copiar todo lo que está debajo de la línea y pegarlo en Design. Los dos logos están en `diseno-sistema/adjuntos/`; súbelos junto con el texto (un prompt de texto no puede llevar imágenes dentro, por eso el logo también quedó descrito con palabras abajo).

---

## Material de marca (descrito aquí y adjunto)

Archivos adjuntos a este mensaje (están en `diseno-sistema/adjuntos/`):
- `logo-magnus-original.jpg`: logo completo sobre fondo blanco.
- `logo-magnus-simbolo.png`: solo el símbolo, recortado.

Descripción del logo, por si no se puede abrir el archivo: una **"M" geométrica negra** de trazo grueso, con **dos cortes diagonales en rojo** (arriba a la izquierda y abajo a la derecha). Debajo, **MAGNUS** en negro, mayúsculas, tipografía geométrica; luego **COMPANY** en rojo y **COLOMBIA** en negro, más pequeños y con letras espaciadas, flanqueados por líneas finas horizontales (roja arriba, negra abajo).

Paleta oficial:
- Negro de marca: `#17151A` (aproximado al del logo; usar como texto principal y fondo oscuro).
- Rojo Magnus: `#D91E26` (acento principal), claro `#FF5A5F`, profundo `#A3141A`.
- Blanco `#FFFFFF` y gris neutro para superficies.

Uso del logo: el símbolo "M" va en la barra lateral y en el ícono de la app; el logo completo, en el inicio de sesión y en los documentos (factura, remisión, comprobante de pago). Sobre fondo oscuro, usar la versión en blanco con el corte rojo. No deformar, no recolorear, dejar espacio libre alrededor.

Nombre en pantalla: **Magnus Company Colombia** (corto: **Magnus**).

## Rol y encargo

Eres un diseñador de producto senior especializado en sistemas de gestión (ERP/operación) para empresas de distribución. Diseña el **sistema interno completo de Magnus Company Colombia**, un proveedor mayorista con más de 800 productos. Entrega un **prototipo de diseño navegable** de todas las pantallas del sistema, en español neutro de Colombia (sin voseo).

**Alcance:** solo el sistema (aplicación interna y apps de trabajo). **No diseñes la página web pública ni el chatbot**: eso va en otra fase. Sí deja un acceso o ítem "Web y chatbot" en el menú del dueño, marcado como "próximamente".

## Contexto del negocio

Magnus vende al por mayor a negocios (tiendas, restaurantes, distribuidores). Hoy el pedido, el stock, el reparto y el personal se manejan con llamadas, papel y Excel. El sistema debe:

- No perder ventas: pedido en pocos toques, stock real a la vista y avisos antes de quedarse sin producto.
- Tener todo a la mano: catálogo, clientes, inventario, entregas y equipo en un solo lugar, en celular, tablet o computador.
- Dar datos claros al dueño: qué se vende, qué no se mueve, qué se vence, quién compra y quién dejó de comprar.
- Facturar sin papeleo: cotización, remisión y factura desde el mismo pedido, con cartera.
- Controlar al equipo: turnos, asistencia, conductores y nómina conectados.

## Usuarios y roles (cada uno entra solo a lo que le corresponde)

1. **Dueño / administración:** panel general, reportes, usuarios y permisos. Usa computador y celular.
2. **Vendedor:** celular o tablet, en la calle. Toma pedidos rápido.
3. **Mostrador / pedido en tienda:** pantalla táctil grande para quien llega al punto de venta.
4. **Caja:** cobra, factura y cuadra.
5. **Bodega:** alista pedidos, recibe mercancía, hace conteos. Celular o tablet, a veces con guantes y poca luz.
6. **Conductor:** app de celular en el vehículo; botones grandes, una mano.
7. **Empleado:** ve sus turnos, horas, comprobantes y solicitudes.

## Pantallas por área (6 áreas, 18 módulos)

### 1. Ventas
- **Pantalla de vendedores:** búsqueda por nombre, código o categoría entre 800+ productos; stock en tiempo real por presentación (unidad, caja, paca, bulto); precio por cliente y descuento por volumen (lo define la administración, el vendedor no lo edita); pedido en pocos toques con historial del cliente y botón "repetir último pedido"; ventas del día y comisiones del vendedor.
- **Pedido en tienda (táctil):** fotos grandes, categorías, búsqueda; el cliente elige presentación y cantidad y ve la disponibilidad; el pedido pasa a caja y bodega con número de turno; el vendedor puede completar o corregir antes de cobrar.
- **Base de clientes:** ficha con datos, NIT, direcciones de entrega y contactos; historial de compras, productos frecuentes, saldo pendiente; lista de precios propia; aviso de "clientes que llevan tiempo sin pedir" con lo que solían llevar.
- **Facturación y cobros:** cotización que se vuelve pedido con un toque; remisión y factura con presentaciones y lotes; medios de pago, abonos y cartera con fechas de vencimiento; la factura electrónica DIAN se hace con un proveedor autorizado (mostrar el estado "enviada/aceptada" como dato, sin diseñar al proveedor); reportes para el contador.

### 2. Bodega y catálogo
- **Inventario por lotes, fechas y cantidad:** cada entrada con lote y fecha de vencimiento; stock por presentación y por bodega con mínimo de alerta; **despacho "primero vence, primero sale"** (mostrar claramente qué lote sale primero); alertas de por vencer, agotado y bajo mínimo; ajustes y mermas con motivo; conteo físico desde el celular; trazabilidad de qué lote salió en cada venta.
- **Catálogo de 800+ productos:** carga masiva desde Excel; categorías, marcas, códigos de barras; presentaciones y tamaños; precios por presentación y por lista (mayorista, distribuidor); activar/inactivar sin borrar historial.
- **Fotos de producto:** el catálogo muestra la foto; usar imágenes de marcador de posición neutras (no ilustraciones) con la etiqueta "Foto por definir".

### 3. Reparto
- **Domicilios:** pedido con dirección, contacto y ventana de entrega; asignar conductor y ordenar la ruta del día; estados: por alistar, cargado, en ruta, entregado, novedad; enlace de seguimiento para el cliente; cobro contra entrega cuadrado con la factura.
- **App del conductor:** entregas del día en orden, abrir dirección en el mapa, marcar cargado/en ruta/entregado con un toque, evidencia con foto y nombre de quien recibe, novedades con motivo (no estaba, rechazó, faltó producto), cobro contra entrega, asistencia al turno.
- **GPS de conductores:** mapa para la administración con la ubicación en vivo (solo durante el turno, con aviso al conductor), historial de recorridos, tiempos entre entregas, hora estimada de llegada.

### 4. Equipo
- **Sistema para empleados:** ver turnos, horas y comprobantes; pedir permisos y cambios de turno; comunicados internos.
- **Control de asistencia:** entrada y salida con foto desde celular o tablet del local; retardos, ausencias y horas extra calculados solos; recargos nocturnos, dominicales y festivos.
- **Turnos:** calendario por área (bodega, ventas, reparto, caja); cambios que el empleado pide y la administración aprueba; aviso de turno sin cubrir.
- **Nómina:** liquidación armada desde asistencia y turnos (horas, recargos, auxilios, deducciones); comprobante por persona; historial inalterable una vez pagada; exportables para el contador.

### 5. Dirección
- **Sistema general (panel del dueño):** el día de un vistazo: ventas, pedidos, entregas y stock crítico; cartera por cobrar y facturas por vencer; usuarios, permisos y configuración; historial de quién hizo qué; acceso rápido a todas las áreas.
- **Reportes para decidir:** ventas por producto, cliente, vendedor y ruta; margen por producto y cliente; rotación (los que más y menos se mueven); qué reponer y cuándo; clientes que dejaron de comprar y los que más compran; comparación entre semanas y meses; exportables.

### 6. Web y atención
No diseñar ahora. Solo el ítem "próximamente" en el menú.

## Flujos que deben quedar conectados en el prototipo

Muestra al menos estos recorridos de punta a punta con datos de ejemplo:
1. Vendedor toma pedido → llega a bodega → bodega alista por lote que vence primero → caja factura → queda en cartera.
2. Pedido a domicilio → se asigna conductor → conductor entrega con foto/firma → el dueño lo ve en el mapa y en el panel.
3. Empleado marca asistencia con foto → se calculan horas y recargos → entran a la nómina.
4. Alerta de lote por vencer → el dueño ve el producto, el lote y la cantidad en riesgo.

## Dirección visual

- **Marca del cliente:** Magnus Company Colombia. Logo negro y rojo sobre fondo blanco (archivos adjuntos). Color de acento **rojo `#D91E26`** (claro `#FF5A5F`, profundo `#A3141A`), negro y blanco como base. Es un sistema de trabajo, no una página de marketing: sobrio, serio, premium.
- **Tema:** claro por defecto, con alto contraste, porque se usa en bodega y en la calle bajo luz fuerte; incluye también versión oscura. El rojo se reserva para acciones principales, alertas críticas y la marca; no pintar texto de colores decorativos.
- **Estados con color + ícono + texto** (nunca solo color): verde = correcto/entregado, ámbar = por vencer/pendiente, rojo = agotado/novedad/vencido, gris = inactivo.
- **Tipografía:** una sola familia sans-serif muy legible, con números tabulares en tablas, precios y cantidades.
- **Densidad:** en computador, tablas densas y filtrables para 800+ productos; en celular y tablet, tarjetas con objetivos táctiles de mínimo 48 px. Conductor y bodega: botones grandes, lectura a primera vista, una mano.
- **Accesibilidad:** contraste AA, foco visible, etiquetas en todos los campos, no depender solo del color.
- **Responsive:** diseñar cada rol para su dispositivo principal (vendedor/conductor/bodega: celular; mostrador: pantalla táctil horizontal; dueño/caja/administración: computador, con vista celular del panel).
- **Sin ilustraciones decorativas ni imágenes de IA.** Para fotos de producto, usar marcadores neutros.
- **Marca de SYSMOOO:** solo un pie discreto "Desarrollado por SYSMOOO" en configuración o acerca de.

## Entregables

1. **Sistema de diseño:** colores, tipografía, espaciado, botones, campos, tablas, tarjetas, alertas, estados, etiquetas, navegación (barra lateral en computador, barra inferior en celular).
2. **Prototipo navegable** con todas las pantallas anteriores, agrupadas por rol y por área, con datos de ejemplo realistas de un mayorista colombiano (arroz, aceite, harina, azúcar, enlatados, aseo; precios en COP con separador de miles; presentaciones unidad/caja/paca/bulto; fechas en formato día/mes/año).
3. **Estados de cada pantalla:** vacío, cargando, error, sin permiso y éxito.
4. **Lista final** de pantallas diseñadas y de lo que quedó pendiente o dudoso.

## Reglas de datos y seguridad (reflejar en el diseño)

- El descuento por volumen y los precios los define la administración; el vendedor no los edita.
- Cada rol ve solo su menú. No mostrar costos ni márgenes a vendedores, bodega ni conductores.
- Acciones sensibles (anular factura, ajustar inventario, pagar nómina) piden confirmación y quedan en el historial de "quién hizo qué".
- La ubicación del conductor solo se muestra durante su turno, con aviso visible.
- Datos de personas (empleados, clientes): mostrar solo lo necesario.
- No incluir contraseñas, llaves ni datos reales. Todo es de ejemplo.

## Lo que NO hacer

- No diseñar la página web ni el chatbot.
- No inventar módulos fuera de los 18 listados.
- No poner precios ni valores del contrato en el sistema.
- No usar el sistema visual morado/naranja/verde de SYSMOOO: este sistema es de Magnus (negro, rojo, blanco).
- No prometer integraciones: la factura electrónica va con proveedor autorizado y el WhatsApp con número verificado, ambos por definir.

## Criterio de terminado

Se puede navegar cada rol de principio a fin, los 4 flujos conectados funcionan con datos de ejemplo, todas las pantallas existen en su dispositivo principal, y cada pantalla tiene sus estados vacío, error y éxito.
