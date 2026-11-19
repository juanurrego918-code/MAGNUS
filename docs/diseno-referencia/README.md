# Handoff: Magnus — sistema de gestión (ventas, bodega, reparto, equipo)

## Overview
Sistema de gestión para **Magnus Company Colombia**, distribuidora mayorista de abarrotes (~824 productos). Ocho interfaces por rol que comparten una sola fuente de datos:

| Rol | Dispositivo | Archivo |
|---|---|---|
| Vendedor | Celular (390×844) | `Vendedor.dc.html` |
| Mostrador (autoservicio) | Tableta horizontal táctil (1194×834) | `Mostrador.dc.html` |
| Caja y facturación | Escritorio (1440×900) | `Caja.dc.html` |
| Bodega | Celular, uso con guantes | `Bodega.dc.html` |
| Conductor | Celular en vehículo | `Conductor.dc.html` |
| Empleado | Celular personal | `Empleado.dc.html` |
| Dueño / administración | Escritorio + vista celular | `Dueno.dc.html` |
| Dueño · Equipo (asistencia, turnos, nómina) | Escritorio | `Dueno Equipo.dc.html` |

`Magnus Sistema.dc.html` es el índice + hoja del sistema de diseño (logo, color, tipografía, estados, botones).

Idioma de la interfaz: **español (Colombia)**. Moneda `$ 1.234.567` (separador de miles `.`, sin decimales, `toLocaleString('es-CO')`). Fechas `dd/mm/aaaa`. Hora 24 h `HH:MM`.

## About the Design Files
Los archivos de este paquete son **referencias de diseño hechas en HTML**: prototipos que muestran apariencia y comportamiento esperados, **no código de producción para copiar**. La tarea es **recrear estos diseños en el entorno del código destino** (React, React Native, Flutter, etc.) con sus patrones y librerías. Si no existe aún un código base, elija el stack más adecuado (sugerencia: backend con API + base de datos relacional; web para Caja/Dueño/Mostrador; app móvil o PWA para Vendedor/Bodega/Conductor/Empleado).

Para ver los prototipos: abra cualquier `.dc.html` en un navegador servido por HTTP local (p. ej. `npx serve .`). Todos cargan `support.js` (runtime del prototipo — ignorar en la implementación) y `magnus-store.js` (datos de ejemplo + reglas de negocio — **sí es referencia útil**).

Cada pantalla tiene en la columna izquierda un **selector de estado** (Normal / Vacío / Cargando / Error / Sin permiso / Éxito) y en la derecha una **nota de diseño**. La barra negra superior y esas columnas laterales son andamiaje del prototipo, no parte del producto.

## Fidelity
**Alta fidelidad (hi-fi)** en layout, jerarquía, copy, estados, tamaños táctiles y flujos. Colores y tipografía son finales para la marca Magnus (ver Tokens).

> Nota: el proyecto tiene asociado el sistema de diseño "Classical" (serif, botones con contorno dorado). **Los prototipos NO lo usan**: siguen la marca Magnus (negro / blanco / rojo, sans-serif) por decisión del brief. Si el equipo decide adoptar Classical, conservar estructura, flujos, tamaños táctiles y reglas de estado, y sustituir solo los tokens visuales.

## Reglas transversales (obligatorias)
1. **Estados nunca solo por color**: siempre color + ícono (Lucide) + texto. Ej. `[⏰ Por vencer]`, `[✕ Agotado]`, `[🚚 En ruta]`.
2. **Rojo Magnus `#D91E26` solo para la acción principal** de cada pantalla (una por pantalla) y avisos de marca. Navegación en tinta `#17151A`.
3. **Zonas táctiles mínimas**: 44 px escritorio · 48 px vendedor · 56–60 px bodega · 64–68 px conductor y mostrador.
4. **Permisos**: vendedores, bodega, conductores y empleados **nunca** ven costos ni márgenes. Vendedor y caja **no editan** precios ni descuentos (se muestran con ícono de candado).
5. **Acciones sensibles** (anular factura, ajuste de inventario, cierre de caja, pagar nómina, aprobar solicitudes, inactivar producto, cambiar permisos) → diálogo de confirmación + entrada en el **historial inalterable** (quién, rol, qué, fecha-hora).
6. **Contraste** ≥ 4.5:1 para texto. Foco visible: `outline: 3px solid #D91E26; outline-offset: 2px`.
7. **Modo oscuro** completo (tokens abajo). Logo: versión negra en claro, versión blanca en oscuro.
8. **Sin conexión** (apps de campo): lo registrado se guarda localmente y se sincroniza al volver la señal; el estado Error lo comunica así.
9. Crédito "Desarrollado por SYSMOOO" solo en Configuración → Acerca de (y pie del índice).

## Design Tokens

### Color — claro
| Token | Hex | Uso |
|---|---|---|
| `--canvas` | `#E6E5E9` | fondo detrás del dispositivo (solo prototipo) |
| `--bg` | `#F4F4F6` | fondo de pantalla |
| `--surface` | `#FFFFFF` | tarjetas, barras |
| `--sunk` | `#ECECEF` | fondos hundidos, hover, skeleton |
| `--line` | `#DCDBE1` | bordes |
| `--line-2` | `#ADABB4` | bordes de inputs / controles |
| `--ink` | `#17151A` | texto, botones de navegación |
| `--ink-2` | `#46434C` | texto secundario |
| `--ink-3` | `#5F5C66` | etiquetas, metadatos |
| `--red` | `#D91E26` | acción principal |
| `--red-press` | `#A3141A` | presionado |
| `--red-text` | `#B3161D` | texto rojo sobre claro |
| `--ok` / `-tint` / `-line` | `#16653A` / `#E4F3E9` / `#9CCFAF` | correcto, entregado |
| `--warn` / `-tint` / `-line` | `#7A4E00` / `#FFF2CC` / `#E6BD5C` | por vencer, bajo mínimo, pendiente |
| `--err` / `-tint` / `-line` | `#A3141A` / `#FDEBEC` / `#EFA2A5` | agotado, novedad, vencido |
| `--info` / `-tint` / `-line` | `#17151A` / `#ECECEF` / `#ADABB4` | en ruta, cargado |
| `--mute` / `-tint` / `-line` | `#56535C` / `#EDEDF0` / `#C9C8CE` | inactivo, sin permiso |
| `--ph` | `#E9E8EC` | placeholder de foto (rayado 135°) |

### Color — oscuro
`--bg #121115 · --surface #1B1A1F · --sunk #25232A · --line #35333B · --line-2 #5A5761 · --ink #F5F4F7 · --ink-2 #CFCCD5 · --ink-3 #ADA9B4 · --red #D91E26 · --red-press #B8181F · --red-text #FF7378 · --ok #6FD99A/#12301F/#2D6B47 · --warn #F4C55B/#352808/#7A5C14 · --err #FF7A7F/#3A1517/#7D2A2E · --info #F5F4F7/#25232A/#5A5761 · --mute #B4B1BA/#26252B/#45434B · --ph #2A282F`

### Tipografía
Familia **Public Sans** (Google Fonts, 400/500/600/700/800). `font-variant-numeric: tabular-nums` global.
| Rol | Tamaño / peso |
|---|---|
| Display (mostrador) | 40/800 (bienvenida), turno 150/800 |
| Título de pantalla | 19–24/800 |
| Subtítulo / nombre producto | 15–18/700–800 |
| Cuerpo | 14–16/400–600, line-height 1.45–1.55 |
| Etiquetas (kicker) | 12/700, uppercase, letter-spacing .08em |
| Cifras KPI | 19–26/800 |
| Chips de estado | 12–13.5/700 |

### Forma y elevación
Radios: chips `999px`; botones 8 px (escritorio) · 10–12 px (celular) · 14–18 px (conductor/mostrador); tarjetas 10 (escritorio) · 12–14 (celular) · 18 (mostrador); hojas inferiores `20px 20px 0 0`.
Sombra: `0 1px 2px rgba(23,21,26,.06), 0 6px 20px rgba(23,21,26,.07)` (oscuro: `0 1px 2px rgba(0,0,0,.4), 0 6px 20px rgba(0,0,0,.35)`).
Espaciado habitual: 4 · 6 · 8 · 10 · 12 · 14 · 16 · 20 · 24 px.

### Componentes base
- **Chip de estado**: alto 26–30 px, padding 0 9–11 px, borde 1 px `*-line`, fondo `*-tint`, texto `*`, ícono Lucide + texto.
- **Botón principal**: fondo `--red`, texto blanco 800; `:active` `--red-press`; deshabilitado opacidad .45.
- **Botón secundario**: borde 1–2 px `--ink`, fondo transparente.
- **Botón navegación**: fondo `--ink`, texto `--bg`.
- **Destructivo**: borde `--err-line`, texto `--err`.
- **Opción seleccionable** (radio visual): borde 1 px `--line-2` → seleccionado 2 px `--ink`, `aria-pressed`.
- **Barra inferior móvil**: 84 px (incluye 18 px de zona segura), 3–5 pestañas, activa con borde superior 3 px `--red`, texto 800 `--ink`.
- **Barra de acción fija** (conductor): 68 px botón + 56 px secundario, al alcance del pulgar.
- **Toast**: fondo `--ink`, texto `--bg`, 2.2–2.6 s, `role="status"`.
- **Diálogo de confirmación**: overlay `rgba(11,10,13,.5)`, panel 460–560 px, línea "Quedará en el historial: <usuario> · <hora>".
- **Skeleton**: bloques `--sunk` con pulso de opacidad .5↔1, 1.2 s.
- **Placeholder de foto**: rayado 135° `--ph`/`--sunk` + ícono imagen + "Foto por definir".

Íconos: **Lucide** (`lucide-static@0.469.0` font en el prototipo; usar el paquete del framework).

## Modelo de datos (ver `magnus-store.js`)
- **Producto**: `id, code (GR-0101), ean, name, brand, cat, active, stock (unidades), min, cost, pres[{name, units, price}], lots[{lot, exp, qty, bod}]`. Presentaciones: Unidad, Paca x N, Caja x N, Bulto x N.
- **Cliente**: `id, name, nit, list (Mayorista|Distribuidor), city, addr[{label,text}], contact, balance, lastDays, freq[productIds], seller, credit (días)`.
- **Pedido**: `id (PED-#####), turno?, client, seller, channel (vendedor|mostrador), created, status (nuevo→alistando→alistado→facturado), lines[{pid, pi, qty, price, picked[{lot,exp,qty,bod}]}], delivery{type (domicilio|recoge), addr, window, driver, seq, status (por_alistar→cargado→en_ruta→entregado|novedad), eta, cod, evidence{name,time,photo,signature}, novedad}, invoice{num (FE-####), dian (enviada|aceptada), pay, due, abonos[], method, remision, annulled}`.
- **Empleado / asistencia / turnos / solicitudes / nómina / historial (log)**.

### Reglas de negocio
- **FEFO**: al alistar, las unidades de cada línea se asignan a los lotes en orden de vencimiento ascendente (`MG.allocate`). Si falta stock, mostrar "Faltan N und".
- **Precio por lista**: Distribuidor = base × 0.96 redondeado a $50 (`MG.price`). Solo administración edita.
- **Descuento por volumen**: 3 % desde $1.000.000; 5 % desde $3.000.000 (`MG.volRate`). Bloqueado para vendedor y caja.
- **Alertas**: agotado (stock ≤ 0), bajo mínimo (stock < min), por vencer (lote ≤ 30 días). Orden: agotado, vence, bajo.
- **Cartera**: estado vencida (dd < 0), por vencer (≤ 5 días), al día. Abonos parciales.
- **Comisión vendedor**: 2 % sobre ventas (definida por administración).
- **Nómina quincenal** (`MG.payroll`, valores de referencia — **validar con contador**): hora = base/210; extra diurna ×1.25; recargo nocturno 35 % (desde 19:00); dominical/festivo 90 %; auxilio transporte (ejemplo $100.000/quincena); salud 4 % + pensión 4 %. Nómina pagada queda **bloqueada**.
- **Ubicación del conductor**: solo durante el turno; aviso fijo en pantalla mientras está activa; se apaga al terminar el turno. El enlace de seguimiento al cliente muestra estado y ETA, nunca la ubicación exacta.
- **Turno de mostrador**: número correlativo, el pedido entra a la cola de Bodega y aparece en Caja con ese número.

## Screens / Views

### Vendedor (celular)
1. **Inicio del día** — KPI ventas de hoy y comisión; botón rojo "Nuevo pedido"; "Llevan tiempo sin pedir" (clientes con ≥ 25 días, lo que solían llevar); avisos de stock (solo agotado/bajo, sin costos).
2. **Base de clientes** — búsqueda por nombre/NIT; tarjeta con iniciales, NIT · lista, saldo.
3. **Ficha del cliente** — lista de precios con candado; saldo pendiente y crédito; último pedido; "Repetir último pedido" (rojo) y "Pedido nuevo"; productos frecuentes; direcciones y contacto (teléfono enmascarado); historial.
4. **Catálogo y pedido** — selector de cliente fijo arriba; búsqueda nombre/código/categoría + lector de barras; chips de categoría; tarjeta con foto, código · marca, chip de stock, precio desde; "Agregar" abre **hoja inferior** con cada presentación, precio, disponibles y contador ±. Barra flotante "Revisar pedido · N ítems · total".
5. **Resumen y envío** — líneas editables (± / papelera), aviso si supera disponible; subtotal, descuento por volumen bloqueado, total; entrega (Domicilio con dirección y ventana 08–11 / 11–14 / 14–17, o Recoge en punto); forma de pago (Contado, Crédito N días, Contra entrega solo si domicilio); nota para bodega. Botón "Enviar a bodega".
6. **Pedido enviado** — confirmación y línea de tiempo en vivo: creado → bodega alista → caja factura → cartera.
7. **Mis pedidos** — estado del pedido y de la entrega.
8. **Ventas y comisiones** — KPIs semana y ventas por cliente.
Pestañas: Inicio · Pedido · Clientes · Pedidos · Ventas.

### Mostrador (tableta horizontal)
1. **Bienvenida** — logo completo, "Arme su pedido aquí", botón 96 px "Tocar para empezar".
2. **Armar pedido** — 3 columnas fijas: categorías (200 px, botones 64 px con ícono) · productos (grid 3 col, tarjeta con foto 120 px, precio c/u, chip, botón 64 px o contador ±) · "Su pedido" (330 px, total y "Confirmar pedido" 80 px). "Cancelar pedido" arriba a la derecha.
3. **Número de turno** — número 150 px en recuadro 280×280 con borde 6 px; texto de instrucción; "Nuevo pedido".

### Caja (escritorio)
Menú lateral 236 px: Cobrar y facturar (con contador) · Cotizaciones · Cartera · Factura y remisión · Cuadre de caja · Reportes para el contador.
1. **Cobrar** — vista dividida: tabla de cola (turno en recuadro, pedido, cliente, origen, estado, total) + panel de cobro 540 px: líneas con lotes, totales, medio de pago (Efectivo / Transferencia / Datáfono / Crédito / Contra entrega), recibido y cambio en efectivo, aviso de cartera si crédito, casilla "Generar también remisión". "Facturar y cobrar $X" deshabilitado si no está alistado o falta efectivo. Tras facturar: tarjeta verde con número, estado DIAN (enviada → aceptada).
2. **Cotizaciones** — tabla con "Convertir en pedido" (lo envía a bodega).
3. **Cartera** — 4 KPI (total, vencida, vence en 5 días, al día), filtros, tabla por factura con "Registrar abono" (diálogo).
4. **Factura y remisión** — selector de documento (Factura / Remisión sin precios con firmas / Comprobante de pago), vista previa 760 px con logo, "Imprimir / PDF", "Anular factura" (motivo obligatorio ≥ 5 caracteres, marca de agua ANULADA).
5. **Cuadre de caja** — totales por medio de pago; base, efectivo esperado, efectivo contado → diferencia (cuadra / sobran / faltan); cerrar pide observación.
6. **Reportes para el contador** — tarjetas con exportar Excel / CSV.

### Bodega (celular, guantes)
Pestañas: Alistar · Alertas · Recibir · Conteo · Más (Ajuste, Trazabilidad).
1. **Pedidos por alistar** — KPI (por alistar, esperan caja, lotes por vencer); tarjetas con id 20 px, cliente, líneas, destino; nuevo resaltado en rojo.
2. **Alistar (FEFO)** — banner "Primero vence, primero sale"; por línea: nombre 18 px, cantidad 26 px + presentación, lotes numerados 1, 2… con vence y bodega, botón "Confirmar línea" 60 px. Barra "Confirmadas X de Y" → "Pedido alistado · pasar a caja".
3. **Pedido alistado** — confirmación y lotes que salieron.
4. **Alertas** — pestañas Por vencer / Agotado / Bajo mínimo con contadores.
5. **Recibir** — producto, presentación, cantidad, lote (formato `L-#####`), vencimiento (futuro), bodega; validación en texto.
6. **Conteo físico** — conteo ciego por lote; muestra diferencia; enviar con diferencia pide confirmación y ajusta.
7. **Ajuste y merma** — lote, merma/sobrante, unidades, motivo (Empaque roto, Producto vencido, Daño en transporte, Error de conteo); confirmación.
8. **Trazabilidad** — buscar lote → qué pedidos/clientes lo recibieron.

### Conductor (celular)
Franja oscura fija "Ubicación compartida con administración · solo durante el turno" mientras el turno está activo. Pestañas: Turno · Entregas · Cierre.
1. **Mi turno** — aviso de ubicación; foto de entrada; "Iniciar turno y compartir ubicación".
2. **Entregas del día** — KPI; paradas numeradas (la siguiente con círculo rojo y borde 2 px; terminadas atenuadas), chip de estado, ventana, "Cobrar $X".
3. **Detalle** — cliente 24 px, dirección, "Abrir mapa" / "Llamar", datos, productos que lleva (sin precios unitarios). Acción fija según estado: Marcar cargado → Salir a ruta → Llegué · registrar entrega; secundario "Reportar novedad".
4. **Evidencia y cobro** — foto (obligatoria), nombre de quien recibe (≥ 3 caracteres), firma con el dedo (opcional), cobro contra entrega con monto grande y medio Efectivo/Transferencia.
5. **Novedad** — No estaba / Rechazó el pedido / Faltó producto / Dirección errada + detalle.
6. **Fin de turno** — resumen, recaudo a entregar en caja, "Terminar turno".

### Empleado (celular)
Pestañas: Marcar · Turnos · Horas · Pedir · Pagos.
1. **Marcar asistencia** — reloj 44 px; estado (sin marcar / a tiempo / N min tarde / cerrado); foto; Marcar entrada/salida; al salir muestra horas ordinarias, nocturnas, extra.
2. **Mis turnos** — semana en lista vertical, hoy con borde 2 px, festivo y cambios marcados.
3. **Horas y recargos** — desglose de la quincena y neto estimado.
4. **Solicitudes** — Permiso / Cambio de turno + detalle; lista con estado.
5. **Desprendible** — por quincena pagada, descargar PDF.

### Dueño (escritorio 1440×900 + celular)
Menú lateral 244 px agrupado: Dirección (Panel, Reportes, Historial, Usuarios y permisos, Configuración) · Ventas (Clientes, Facturación y cartera → Caja) · Bodega y catálogo (Inventario por lotes, Catálogo) · Reparto (Domicilios, Mapa) · Equipo (Asistencia, Turnos, Nómina → Dueño Equipo) · Web y atención (Próximamente, deshabilitado).
1. **Panel general** — 4 KPI clicables (Ventas de hoy, Entregas, Stock crítico, Cartera); Stock crítico y lotes por vencer (valor a costo en riesgo); Entregas de hoy (novedades primero); Cartera por vencer; Quién hizo qué.
2. **Lote en riesgo** (flujo 4) — producto, chip "Lote X vence en N días", 5 datos (vence, unidades, valor a costo, valor a precio, riesgo estimado según venta media), tabla de lotes en orden FEFO, recomendación, "Avisar a vendedores", "Definir precio especial del lote".
3. **Domicilios** — conteo por estado; tabla con selector de conductor (ausentes deshabilitados), orden ↑↓, estado, llegada, "Copiar enlace" de seguimiento. Sin asignar resaltado en ámbar.
4. **Mapa de conductores** — mapa (proveedor por definir) con pines por cliente (verde entregado, rojo novedad) y camiones en vivo; panel 400 px con tarjeta por conductor y recorrido con tiempos entre entregas.
5. **Inventario por lotes** — filtros con conteo; tabla con lote que sale primero, stock por presentación, estado.
6. **Catálogo** — búsqueda (incluye código de barras), categoría, tabla con precios por lista, costo, margen, interruptor Activo (confirmación); "Carga masiva desde Excel" con revisión (válidos / advertencias / rechazados) antes de importar.
7. **Clientes** — tabla con margen; panel "Dejaron de comprar".
8. **Reportes** — Por producto, cliente, vendedor, ruta, Margen, Rotación, Qué reponer; comparativo semana o mes (barra actual + barra gris anterior); exportar.
9. **Historial** — filtro por rol; registro inalterable.
10. **Usuarios y permisos** — matriz permiso × rol con interruptores; reglas fijas con candado.
11. **Configuración** — listas de precios, escalas de descuento, integraciones por definir (DIAN, WhatsApp), Acerca de (logo + "Desarrollado por SYSMOOO").
**Vista celular**: KPIs 2×2, "Requiere atención", entregas, detalle de lote; pestañas Panel · Reparto · Equipo · Cartera.

### Dueño · Equipo (escritorio)
1. **Asistencia de hoy** — KPI (presentes, tarde, ausentes, por entrar); tabla con foto de marcación, turno, entrada/salida, estado, horas.
2. **Turnos** — cuadrícula semana × persona por área; festivo en ámbar; sin cubrir con borde rojo punteado y texto; cambios con ícono; "Publicar a empleados".
3. **Solicitudes** — Aprobar / Rechazar (confirmación); aprobar un cambio actualiza el calendario.
4. **Nómina** — prenómina por empleado (básico, extra, nocturno, festivo, recargos, auxilio, deducciones, neto, novedad), total, "Exportar para el contador", "Pagar nómina" (confirmación) → bloqueada; historial de nóminas pagadas.

## Estados por pantalla
Cada pantalla define: **Vacío** (ícono, título, explicación, acción), **Cargando** (skeleton con texto "Cargando …"), **Error** (mensaje específico del contexto; en campo: "se guarda en el celular y se envía al volver la señal"), **Sin permiso** (explica qué no puede ver ese rol y a quién pedirlo), **Éxito** (confirmación). Textos exactos en el arreglo `SCREENS` de cada archivo.

## Interactions & Behavior
- Animación de entrada de toasts, hojas y confirmaciones: `opacity 0→1, translateY(10px)→0`, 0.2–0.35 s ease-out.
- Hoja inferior de presentaciones: overlay oscuro, cerrar tocando fuera o "X".
- Contadores ± limitados por disponible de la presentación (considerando otras presentaciones del mismo producto).
- Estado DIAN pasa de "enviada" a "aceptada" de forma asíncrona (simulado 2.6 s).
- Mostrador vuelve a bienvenida tras inactividad (60 s, en nota).
- Cambios en un rol se reflejan en los demás (en el prototipo vía `localStorage` + evento `storage`; en producción vía API + tiempo real/polling).

## State Management
Entidades del servidor: productos, lotes, clientes, pedidos, entregas, facturas/abonos, cotizaciones, asistencia, turnos, solicitudes, nómina, historial, permisos. Estado local por pantalla: filtros, búsqueda, carrito, presentación en hoja, selección de pago, formularios con `tried` para validar al enviar, diálogos.

## Assets
- `assets/logo-magnus.png` / `assets/logo-magnus-blanco.png` — logo completo (negro / blanco), recortados del logo provisto por el cliente.
- `assets/simbolo-magnus.png` / `assets/simbolo-magnus-blanco.png` — símbolo solo.
- Fotos de producto: **por definir** (placeholders).
- Íconos: Lucide.
- Fuente: Public Sans (Google Fonts).

## Por definir
Proveedor de factura electrónica DIAN, número verificado de WhatsApp, proveedor de mapas, fotos de producto, porcentajes finales de nómina (contador), módulo Web y chatbot.

## Files
- `Magnus Sistema.dc.html` — índice, flujos y hoja del sistema de diseño.
- `Vendedor.dc.html`, `Mostrador.dc.html`, `Caja.dc.html`, `Bodega.dc.html`, `Conductor.dc.html`, `Empleado.dc.html`, `Dueno.dc.html`, `Dueno Equipo.dc.html` — prototipos por rol (plantilla HTML + clase de lógica en el `<script>` al final de cada archivo).
- `magnus-store.js` — datos de ejemplo, reglas de negocio (FEFO, precios, descuentos, alertas, nómina) y mapa de estados → color/ícono/texto (`MG.ST`).
- `support.js` — runtime del prototipo; no forma parte del producto.
- `assets/` — logos.
