# Fase 04 · Equipo (asistencia, turnos, solicitudes y nómina)

## Qué incluye
- `supabase/migrations/0007_retencion_gps.sql`: los puntos de GPS se borran a los **7 días** (tarea diaria con pg_cron) y solo se asigna a conductores con turno abierto (decisiones de Juan).
- `supabase/migrations/0008_equipo.sql`: empleados, turnos, asistencia con foto, solicitudes, festivos 2026, ajustes de nómina y nómina quincenal.
- `supabase/tests/04_fase04.sql`: pruebas de horas, recargos, ausencias, solicitudes, nómina, bloqueo y privacidad (164 en total).
- Web, empleado: `/marcar` (entrada y salida con foto, próximos turnos y neto estimado de la quincena), `/solicitudes` y `/desprendibles`.
- Web, dueño: `/equipo` (asistencia de hoy, aprobar solicitudes, programar turnos, crear empleados) y `/nomina` (calcular, pagar con confirmación, historial).

## Cómo se calcula (valores de REFERENCIA, validar con el contador)
- Hora = salario / 210. Básico quincenal = salario / 2 − (días sin marcar × salario / 30). Un día programado, pasado, sin marcación y sin permiso aprobado cuenta como ausencia.
- Extra diurna: horas sobre 8 al día × hora × 1,25. Recargo nocturno (19:00 a 06:00): 35 % de la hora. Dominical o festivo: 90 % de la hora. Se acumulan si coinciden.
- Auxilio de transporte: $ 100.000 por quincena. Salud 4 % y pensión 4 % sobre el devengado sin auxilio.
- Todo está en la tabla `payroll_settings` y cada nómina guarda los valores que usó. Los festivos de Colombia 2026 están en `holidays` (validar contra el calendario oficial; faltan otros años).

## Reglas que cumple
- Foto obligatoria en entrada y salida, en la carpeta del propio empleado. Una entrada por día.
- La nómina pagada queda **bloqueada** (no se edita, recalcula ni borra) y el pago queda en el historial. No se paga una quincena que no ha terminado.
- Cada empleado ve solo su ficha, su asistencia y sus desprendibles. Sueldos y nómina: solo el dueño.

## Decisiones tomadas (confirmar con Juan)
- Aprobar un cambio de turno no modifica el calendario; el dueño lo ajusta en `/equipo`.
- La nómina electrónica ante la DIAN va por proveedor autorizado (por definir); aquí solo se calcula y se paga internamente.
- Las fotos de asistencia son datos personales: falta definir cuánto tiempo se conservan (Ley 1581), igual que se hizo con el GPS.

## Pendiente
- Cuadrícula semanal de turnos como en el diseño (hoy es lista), exportar para el contador y aviso de privacidad en pantalla.
- Probar las pantallas con un navegador real: este entorno no llega a Supabase.
