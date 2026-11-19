// Magnus — datos de ejemplo y estado compartido entre los prototipos por rol (localStorage).
(function () {
  var KEY = 'magnus-proto-v4';
  var HOY = '2026-11-17';
  function d(off) { var t = new Date(HOY + 'T12:00:00'); t.setDate(t.getDate() + off); return t.toISOString().slice(0, 10); }
  var P = function (id, code, name, brand, cat, pres, stock, min, cost, lots, active) {
    return { id: id, code: code, ean: '77' + String(1000000000 + id * 7919).slice(0, 11), name: name, brand: brand, cat: cat, pres: pres, stock: stock, min: min, cost: cost, lots: lots, active: active !== false };
  };
  var L = function (lot, exp, qty, bod) { return { lot: lot, exp: exp, qty: qty, bod: bod || 'Principal' }; };
  function seed() {
    var products = [
      P(1, 'GR-0101', 'Arroz blanco 500 g', 'Granero Real', 'Granos', [['Unidad', 1, 2350], ['Paca x 25', 25, 56500], ['Bulto x 50', 50, 109000]], 1840, 600, 1780, [L('L-24311', d(9), 340), L('L-24402', d(64), 900), L('L-24455', d(118), 600, 'Norte')]),
      P(2, 'GR-0102', 'Arroz blanco 5 kg', 'Granero Real', 'Granos', [['Unidad', 1, 21900], ['Paca x 5', 5, 107000]], 310, 120, 17600, [L('L-24318', d(40), 150), L('L-24460', d(130), 160)]),
      P(3, 'GR-0140', 'Fríjol cargamanto 500 g', 'Del Campo', 'Granos', [['Unidad', 1, 6900], ['Paca x 24', 24, 160800]], 96, 150, 5300, [L('L-24290', d(22), 96)]),
      P(4, 'GR-0155', 'Lenteja 500 g', 'Del Campo', 'Granos', [['Unidad', 1, 4200], ['Paca x 24', 24, 98400]], 520, 200, 3100, [L('L-24301', d(75), 520)]),
      P(5, 'AC-0201', 'Aceite vegetal 1 L', 'Doña Clara', 'Aceites', [['Unidad', 1, 9800], ['Caja x 12', 12, 114000]], 0, 144, 7900, []),
      P(6, 'AC-0203', 'Aceite vegetal 3 L', 'Doña Clara', 'Aceites', [['Unidad', 1, 27500], ['Caja x 6', 6, 160200]], 210, 60, 22300, [L('L-24270', d(150), 210)]),
      P(7, 'AC-0210', 'Aceite de palma 18 L', 'Palmar', 'Aceites', [['Garrafa', 1, 148000]], 34, 10, 121000, [L('L-24288', d(200), 34)]),
      P(8, 'HA-0301', 'Harina de trigo 1 kg', 'Molinos Altos', 'Harinas', [['Unidad', 1, 3900], ['Paca x 25', 25, 94000], ['Bulto x 50 kg', 50, 142000]], 760, 300, 2900, [L('L-24250', d(5), 180), L('L-24390', d(88), 580)]),
      P(9, 'HA-0320', 'Harina de maíz precocida 1 kg', 'Molinos Altos', 'Harinas', [['Unidad', 1, 3600], ['Paca x 24', 24, 84000]], 1150, 400, 2650, [L('L-24333', d(52), 650), L('L-24470', d(140), 500)]),
      P(10, 'AZ-0401', 'Azúcar blanca 1 kg', 'Ingenio Sur', 'Azúcar', [['Unidad', 1, 4700], ['Paca x 25', 25, 113000], ['Bulto x 50 kg', 50, 215000]], 2100, 800, 3700, [L('L-24210', d(300), 2100)]),
      P(11, 'AZ-0410', 'Panela 500 g', 'Trapiche Viejo', 'Azúcar', [['Unidad', 1, 2600], ['Paca x 24', 24, 60000]], 180, 240, 1900, [L('L-24360', d(14), 180)]),
      P(12, 'EN-0501', 'Atún en aceite 160 g', 'Mar Azul', 'Enlatados', [['Unidad', 1, 5900], ['Caja x 48', 48, 268000]], 960, 288, 4500, [L('L-24120', d(260), 480), L('L-24380', d(420), 480)]),
      P(13, 'EN-0510', 'Sardinas en tomate 425 g', 'Mar Azul', 'Enlatados', [['Unidad', 1, 7400], ['Caja x 24', 24, 170000]], 240, 96, 5700, [L('L-24100', d(18), 96), L('L-24350', d(380), 144)]),
      P(14, 'EN-0520', 'Maíz tierno 300 g', 'Huerta Fina', 'Enlatados', [['Unidad', 1, 4300], ['Caja x 24', 24, 98000]], 70, 96, 3200, [L('L-24205', d(190), 70)]),
      P(15, 'AS-0601', 'Detergente en polvo 1 kg', 'Brillo', 'Aseo', [['Unidad', 1, 8900], ['Paca x 12', 12, 102000]], 430, 120, 6800, [L('L-24150', d(500), 430)]),
      P(16, 'AS-0610', 'Jabón de barra x 3', 'Brillo', 'Aseo', [['Unidad', 1, 5200], ['Caja x 24', 24, 119000]], 300, 96, 3900, [L('L-24160', d(600), 300)]),
      P(17, 'AS-0620', 'Papel higiénico x 12', 'Suave Hogar', 'Aseo', [['Paca', 1, 18900], ['Bulto x 4', 4, 72000]], 160, 60, 14800, [L('L-24170', d(900), 160)]),
      P(18, 'AS-0630', 'Blanqueador 2 L', 'Brillo', 'Aseo', [['Unidad', 1, 7600], ['Caja x 6', 6, 43200]], 0, 48, 5600, [], false),
      P(19, 'BE-0701', 'Café molido 500 g', 'Alto Cauca', 'Bebidas', [['Unidad', 1, 16900], ['Caja x 12', 12, 194000]], 220, 72, 13100, [L('L-24180', d(27), 60), L('L-24400', d(210), 160)]),
      P(20, 'BE-0710', 'Chocolate de mesa 500 g', 'Alto Cauca', 'Bebidas', [['Unidad', 1, 9200], ['Caja x 24', 24, 211000]], 330, 96, 7000, [L('L-24190', d(160), 330)]),
      P(21, 'GR-0170', 'Arveja seca 500 g', 'Del Campo', 'Granos', [['Unidad', 1, 3800], ['Paca x 24', 24, 88800]], 410, 150, 2800, [L('L-24312', d(95), 410)]),
      P(22, 'HA-0330', 'Avena en hojuelas 500 g', 'Molinos Altos', 'Harinas', [['Unidad', 1, 4100], ['Paca x 24', 24, 96000]], 260, 100, 3000, [L('L-24341', d(29), 120), L('L-24480', d(170), 140)]),
      P(23, 'EN-0530', 'Salsa de tomate 400 g', 'Huerta Fina', 'Enlatados', [['Unidad', 1, 5600], ['Caja x 24', 24, 128000]], 380, 96, 4100, [L('L-24222', d(240), 380)]),
      P(24, 'AS-0640', 'Lavaloza 500 g', 'Brillo', 'Aseo', [['Unidad', 1, 4900], ['Caja x 24', 24, 112000]], 290, 96, 3600, [L('L-24230', d(700), 290)])
    ];
    products.forEach(function (p) { p.pres = p.pres.map(function (x) { return { name: x[0], units: x[1], price: x[2] }; }); });
    var clients = [
      { id: 'C01', name: 'Tienda La Esquina', nit: '900.123.456-7', list: 'Mayorista', disc: 0.03, city: 'Bogotá', addr: [{ label: 'Principal', text: 'Cra. 68 # 23-41, Fontibón' }], contact: { name: 'Gloria Pinzón', phone: '310 ••• 4521' }, balance: 1240000, lastDays: 3, freq: [1, 10, 5, 8], seller: 'Diana Restrepo', credit: 30 },
      { id: 'C02', name: 'Restaurante El Fogón', nit: '901.555.210-3', list: 'Mayorista', disc: 0.05, city: 'Bogotá', addr: [{ label: 'Cocina', text: 'Cl. 72 # 10-15, Chapinero' }], contact: { name: 'Hernán Suárez', phone: '315 ••• 9902' }, balance: 0, lastDays: 6, freq: [6, 2, 3, 11], seller: 'Diana Restrepo', credit: 15 },
      { id: 'C03', name: 'Minimercado San José', nit: '830.441.982-1', list: 'Distribuidor', disc: 0.08, city: 'Soacha', addr: [{ label: 'Local', text: 'Av. Indumil # 4-20, Soacha' }, { label: 'Bodega', text: 'Cl. 13 # 9-55, Soacha' }], contact: { name: 'Yolanda Mejía', phone: '320 ••• 1187' }, balance: 3860000, lastDays: 34, freq: [9, 12, 15, 10], seller: 'Diana Restrepo', credit: 30 },
      { id: 'C04', name: 'Panadería Trigo Dorado', nit: '900.887.301-5', list: 'Mayorista', disc: 0.04, city: 'Bogotá', addr: [{ label: 'Principal', text: 'Cl. 45 Sur # 78-12, Kennedy' }], contact: { name: 'Óscar Rincón', phone: '311 ••• 6043' }, balance: 520000, lastDays: 2, freq: [8, 10, 22, 6], seller: 'Andrés Gómez', credit: 15 },
      { id: 'C05', name: 'Distribuidora Los Andes', nit: '860.034.775-9', list: 'Distribuidor', disc: 0.1, city: 'Mosquera', addr: [{ label: 'Bodega', text: 'Km 2 vía Funza, Mosquera' }], contact: { name: 'Patricia León', phone: '317 ••• 3390' }, balance: 7450000, lastDays: 9, freq: [1, 10, 12, 15], seller: 'Andrés Gómez', credit: 45 },
      { id: 'C06', name: 'Cafetería Central', nit: '901.220.640-2', list: 'Mayorista', disc: 0.02, city: 'Bogotá', addr: [{ label: 'Local', text: 'Cra. 7 # 18-30, Centro' }], contact: { name: 'Ricardo Ávila', phone: '300 ••• 7712' }, balance: 0, lastDays: 41, freq: [19, 20, 10], seller: 'Diana Restrepo', credit: 0 },
      { id: 'C07', name: 'Supermercado La 80', nit: '900.765.118-4', list: 'Distribuidor', disc: 0.07, city: 'Bogotá', addr: [{ label: 'Principal', text: 'Av. Cl. 80 # 95-08, Engativá' }], contact: { name: 'Sandra Quintero', phone: '312 ••• 2268' }, balance: 2180000, lastDays: 27, freq: [4, 21, 13, 23], seller: 'Andrés Gómez', credit: 30 },
      { id: 'C08', name: 'Hotel Plaza Bosa', nit: '901.403.559-8', list: 'Mayorista', disc: 0.03, city: 'Bogotá', addr: [{ label: 'Recepción', text: 'Cl. 65 Sur # 80C-14, Bosa' }], contact: { name: 'Fabián Torres', phone: '318 ••• 5530' }, balance: 860000, lastDays: 12, freq: [17, 15, 24, 19], seller: 'Diana Restrepo', credit: 15 }
    ];
    var employees = [
      { id: 'E01', name: 'Diana Restrepo', role: 'Vendedora', area: 'Ventas', base: 1950000 },
      { id: 'E02', name: 'Andrés Gómez', role: 'Vendedor', area: 'Ventas', base: 1950000 },
      { id: 'E03', name: 'Marcela Ortiz', role: 'Auxiliar de bodega', area: 'Bodega', base: 1700000 },
      { id: 'E04', name: 'Camilo Vargas', role: 'Auxiliar de bodega', area: 'Bodega', base: 1700000 },
      { id: 'E05', name: 'Kelly Cárdenas', role: 'Cajera', area: 'Caja', base: 1750000 },
      { id: 'E06', name: 'Jhon Fredy Mora', role: 'Conductor', area: 'Reparto', base: 1850000 },
      { id: 'E07', name: 'Luis Carlos Peña', role: 'Conductor', area: 'Reparto', base: 1850000 },
      { id: 'E08', name: 'Wilson Ríos', role: 'Conductor', area: 'Reparto', base: 1850000 }
    ];
    function ln(pid, pi, qty) { var p = products[pid - 1]; return { pid: pid, pi: pi, qty: qty, price: p.pres[pi].price, picked: null }; }
    var orders = [
      { id: 'PED-10471', turno: null, client: 'C04', seller: 'Andrés Gómez', channel: 'vendedor', created: HOY + ' 07:42', status: 'facturado', lines: [ln(8, 1, 4), ln(10, 1, 2)], delivery: { type: 'domicilio', addr: 'Cl. 45 Sur # 78-12, Kennedy', window: '08:00–10:00', driver: 'E06', status: 'entregado', seq: 1, eta: '08:40', evidence: { name: 'Óscar Rincón', time: '08:37', photo: true }, cod: 0 }, invoice: { num: 'FE-3381', dian: 'aceptada', pay: 'Crédito 15 días', due: d(15), paid: 0 } },
      { id: 'PED-10474', turno: null, client: 'C02', seller: 'Diana Restrepo', channel: 'vendedor', created: HOY + ' 08:05', status: 'facturado', lines: [ln(6, 1, 3), ln(2, 0, 6), ln(3, 0, 12)], delivery: { type: 'domicilio', addr: 'Cl. 72 # 10-15, Chapinero', window: '09:00–11:00', driver: 'E06', status: 'en_ruta', seq: 2, eta: '10:05', cod: 0 }, invoice: { num: 'FE-3384', dian: 'aceptada', pay: 'Contado', due: HOY, paid: 1 } },
      { id: 'PED-10476', turno: null, client: 'C08', seller: 'Diana Restrepo', channel: 'vendedor', created: HOY + ' 08:20', status: 'facturado', lines: [ln(17, 1, 2), ln(19, 0, 10), ln(24, 1, 1)], delivery: { type: 'domicilio', addr: 'Cl. 65 Sur # 80C-14, Bosa', window: '10:00–12:00', driver: 'E06', status: 'cargado', seq: 3, eta: '11:10', cod: 466200 }, invoice: { num: 'FE-3386', dian: 'enviada', pay: 'Contra entrega', due: HOY, paid: 0 } },
      { id: 'PED-10479', turno: null, client: 'C07', seller: 'Andrés Gómez', channel: 'vendedor', created: HOY + ' 08:51', status: 'facturado', lines: [ln(4, 1, 3), ln(21, 1, 2), ln(23, 1, 2)], delivery: { type: 'domicilio', addr: 'Av. Cl. 80 # 95-08, Engativá', window: '10:00–13:00', driver: 'E07', status: 'novedad', seq: 1, eta: '—', novedad: 'No estaba — local cerrado', cod: 0 }, invoice: { num: 'FE-3387', dian: 'aceptada', pay: 'Crédito 30 días', due: d(30), paid: 0 } },
      { id: 'PED-10480', turno: 14, client: 'C06', seller: 'Mostrador', channel: 'mostrador', created: HOY + ' 09:12', status: 'alistado', lines: [ln(19, 0, 6), ln(20, 0, 6)], delivery: { type: 'recoge' } },
      { id: 'PED-10481', turno: null, client: 'C05', seller: 'Andrés Gómez', channel: 'vendedor', created: HOY + ' 09:30', status: 'nuevo', lines: [ln(1, 2, 10), ln(10, 2, 8), ln(12, 1, 4)], delivery: { type: 'domicilio', addr: 'Km 2 vía Funza, Mosquera', window: '14:00–17:00', driver: null, status: 'por_alistar', seq: null, eta: '—', cod: 0 } }
    ];
    var shifts = {
      // día(0=lun..6=dom) -> [empId, turno]
      Bodega: [['E03', 'L–S 06:00–14:00'], ['E04', 'L–S 14:00–22:00']],
      Ventas: [['E01', 'L–V 07:00–16:00'], ['E02', 'L–V 07:00–16:00']],
      Caja: [['E05', 'L–S 07:00–15:00'], [null, 'S 15:00–20:00 · sin cubrir']],
      Reparto: [['E06', 'L–S 07:00–16:00'], ['E07', 'L–S 07:00–16:00'], ['E08', 'L–S 09:00–18:00']]
    };
    // Horas de la quincena en curso (16–30 nov). Incluye festivo lunes 16/11.
    var hours = {
      E01: { ord: 8, ext: 0, noct: 0, dom: 0, fest: 0, late: 0 }, E02: { ord: 8, ext: 1, noct: 0, dom: 0, fest: 0, late: 1 },
      E03: { ord: 8, ext: 2, noct: 0, dom: 0, fest: 8, late: 0 }, E04: { ord: 8, ext: 0, noct: 6, dom: 0, fest: 8, late: 0 },
      E05: { ord: 8, ext: 0, noct: 0, dom: 0, fest: 0, late: 0 }, E06: { ord: 9, ext: 1, noct: 0, dom: 0, fest: 6, late: 0 },
      E07: { ord: 9, ext: 0, noct: 0, dom: 0, fest: 0, late: 2 }, E08: { ord: 0, ext: 0, noct: 0, dom: 0, fest: 0, late: 0, absent: 1 }
    };
    return {
      v: 4, hoy: HOY,
      legacy: [['FE-3302','C01',1240000,-33,-3],['FE-3255','C03',2100000,-49,-19],['FE-3290','C03',1760000,-26,4],['FE-3340','C04',520000,-7,8],['FE-3270','C05',4000000,-51,-6],['FE-3335','C05',3450000,-20,25],['FE-3311','C07',2180000,-28,2],['FE-3348','C08',860000,-3,12]].map(function (r) { return { num: r[0], client: r[1], total: r[2], date: d(r[3]), due: d(r[4]), abonos: [], dian: 'aceptada' }; }),
      quotes: [{ id: 'COT-0218', client: 'C05', created: d(-1), valid: d(6), lines: [ln(9, 1, 20), ln(12, 1, 6), ln(15, 1, 10)], status: 'abierta' }, { id: 'COT-0221', client: 'C02', created: HOY, valid: d(7), lines: [ln(6, 1, 4), ln(13, 1, 2)], status: 'abierta' }, { id: 'COT-0209', client: 'C07', created: d(-9), valid: d(-2), lines: [ln(1, 1, 30)], status: 'vencida' }],
      cash: { base: 300000, closed: false }, products: products, clients: clients, employees: employees, orders: orders, shifts: shifts, hours: hours,
      attendance: [{ emp: 'E03', date: HOY, in: '05:56', out: null, photo: true, late: 0 }, { emp: 'E06', date: HOY, in: '06:58', out: null, photo: true, late: 0 }, { emp: 'E07', date: HOY, in: '07:14', out: null, photo: true, late: 14 }],
      requests: [{ id: 'S-221', emp: 'E04', type: 'Cambio de turno', detail: 'Sáb 21/11: cambiar 14:00–22:00 por 06:00–14:00 con Marcela Ortiz', status: 'pendiente' }, { id: 'S-219', emp: 'E01', type: 'Permiso', detail: 'Vie 27/11 · cita médica 08:00–11:00', status: 'aprobada' }],
      payroll: [{ period: '01/11/2026 – 15/11/2026', status: 'pagada', paidAt: '16/11/2026 10:12', by: 'Administración', total: 9842300 }],
      log: [
        { who: 'Kelly Cárdenas', role: 'Caja', what: 'Facturó PED-10476 → FE-3386', when: HOY + ' 08:31' },
        { who: 'Marcela Ortiz', role: 'Bodega', what: 'Ajuste de inventario: −6 und Panela 500 g (L-24360) · motivo: empaque roto', when: HOY + ' 07:55' },
        { who: 'Administración', role: 'Dueño', what: 'Pagó nómina 01/11–15/11/2026', when: '2026-11-16 10:12' }
      ],
      seq: { order: 10482, invoice: 3388, turno: 15 }
    };
  }
  var listeners = [];
  var MG = {
    HOY: HOY,
    get: function () { try { var s = JSON.parse(localStorage.getItem(KEY)); if (s && s.v === 4) return s; } catch (e) {} var s2 = seed(); localStorage.setItem(KEY, JSON.stringify(s2)); return s2; },
    set: function (fn) { var s = MG.get(); fn(s); localStorage.setItem(KEY, JSON.stringify(s)); listeners.forEach(function (l) { l(s); }); return s; },
    reset: function () { localStorage.setItem(KEY, JSON.stringify(seed())); var s = MG.get(); listeners.forEach(function (l) { l(s); }); },
    subscribe: function (cb) { listeners.push(cb); var h = function (e) { if (e.key === KEY) cb(MG.get()); }; window.addEventListener('storage', h); return function () { listeners = listeners.filter(function (x) { return x !== cb; }); window.removeEventListener('storage', h); }; },
    log: function (s, who, role, what) { s.log.unshift({ who: who, role: role, what: what, when: HOY + ' ' + MG.now() }); },
    now: function () { var t = new Date(); return String(t.getHours()).padStart(2, '0') + ':' + String(t.getMinutes()).padStart(2, '0'); },
    cop: function (n) { return '$ ' + Math.round(n || 0).toLocaleString('es-CO'); },
    num: function (n) { return Math.round(n || 0).toLocaleString('es-CO'); },
    date: function (iso) { if (!iso) return '—'; var p = iso.slice(0, 10).split('-'); return p[2] + '/' + p[1] + '/' + p[0]; },
    daysTo: function (iso) { return Math.round((new Date(iso + 'T12:00:00') - new Date(HOY + 'T12:00:00')) / 864e5); },
    prod: function (s, id) { return s.products.find(function (p) { return p.id === id; }); },
    client: function (s, id) { return s.clients.find(function (c) { return c.id === id; }); },
    emp: function (s, id) { return s.employees.find(function (e) { return e.id === id; }); },
    fefo: function (p) { return p.lots.slice().sort(function (a, b) { return a.exp < b.exp ? -1 : 1; }); },
    // Reparte las unidades de una línea entre lotes, primero vence primero sale
    allocate: function (p, units) { var out = [], left = units; MG.fefo(p).forEach(function (l) { if (left <= 0 || l.qty <= 0) return; var t = Math.min(l.qty, left); out.push({ lot: l.lot, exp: l.exp, qty: t, bod: l.bod }); left -= t; }); return { lots: out, missing: left }; },
    lineUnits: function (s, ln) { var p = MG.prod(s, ln.pid); return ln.qty * p.pres[ln.pi].units; },
    price: function (c, p, pi) { var f = c && c.list === 'Distribuidor' ? 0.96 : 1; return Math.round(p.pres[pi].price * f / 50) * 50; },
    volRate: function (sub) { return sub >= 3000000 ? 0.05 : sub >= 1000000 ? 0.03 : 0; },
    total: function (s, o) { var sub = o.lines.reduce(function (a, l) { return a + l.qty * l.price; }, 0); var rate = MG.volRate(sub); var disc = Math.round(sub * rate); return { sub: sub, rate: rate, disc: disc, total: sub - disc }; },
    paid: function (o) { return o.invoice ? (o.invoice.abonos || []).reduce(function (a, x) { return a + x.v; }, 0) : 0; },
    stockStatus: function (p) { if (!p.active) return 'inactivo'; if (p.stock <= 0) return 'agotado'; if (p.stock < p.min) return 'bajo'; return 'ok'; },
    alerts: function (s) {
      var a = [];
      s.products.forEach(function (p) {
        if (!p.active) return;
        if (p.stock <= 0) a.push({ kind: 'agotado', p: p, text: 'Agotado' });
        else if (p.stock < p.min) a.push({ kind: 'bajo', p: p, text: 'Bajo mínimo: ' + MG.num(p.stock) + ' de ' + MG.num(p.min) + ' und' });
        p.lots.forEach(function (l) { var dd = MG.daysTo(l.exp); if (dd <= 30) a.push({ kind: 'vence', p: p, lot: l, days: dd, text: 'Lote ' + l.lot + ' vence en ' + dd + ' días' }); });
      });
      return a.sort(function (x, y) { var r = { agotado: 0, vence: 1, bajo: 2 }; return r[x.kind] - r[y.kind] || (x.days || 0) - (y.days || 0); });
    },
    // Estado → color + ícono + texto
    ST: {
      ok: ['Correcto', 'circle-check', 'ok'], entregado: ['Entregado', 'circle-check', 'ok'], aceptada: ['DIAN aceptada', 'circle-check', 'ok'], pagada: ['Pagada', 'lock', 'ok'], alistado: ['Alistado', 'package-check', 'ok'], facturado: ['Facturado', 'receipt', 'ok'], aprobada: ['Aprobada', 'circle-check', 'ok'],
      bajo: ['Bajo mínimo', 'triangle-alert', 'warn'], vence: ['Por vencer', 'clock-alert', 'warn'], por_alistar: ['Por alistar', 'clock', 'warn'], nuevo: ['Nuevo', 'clock', 'warn'], enviada: ['DIAN enviada', 'send', 'warn'], pendiente: ['Pendiente', 'clock', 'warn'], alistando: ['Alistando', 'loader', 'warn'],
      cargado: ['Cargado', 'package', 'info'], en_ruta: ['En ruta', 'truck', 'info'],
      agotado: ['Agotado', 'circle-x', 'err'], novedad: ['Novedad', 'octagon-alert', 'err'], vencido: ['Vencido', 'circle-x', 'err'], rechazada: ['Rechazada', 'circle-x', 'err'],
      inactivo: ['Inactivo', 'circle-minus', 'mute']
    },
    chip: function (key, label) { var t = MG.ST[key] || ['—', 'circle', 'mute']; return { label: label || t[0], icon: 'icon-' + t[1], bg: 'var(--' + t[2] + '-tint)', fg: 'var(--' + t[2] + ')', bd: 'var(--' + t[2] + '-line)' }; },
    // Nómina de ejemplo: porcentajes de referencia, validar con el contador.
    RATES: { ext: 0.25, noct: 0.35, dom: 0.9, fest: 0.9, horasMes: 210, aux: 100000, salud: 0.04, pension: 0.04 },
    hoursOf: function (s, id) {
      var h = Object.assign({ ord: 0, ext: 0, noct: 0, dom: 0, fest: 0, late: 0, absent: 0 }, s.hours[id] || {});
      s.attendance.forEach(function (a) { if (a.emp !== id || a.date !== HOY) return; if (a.calc) { h.ord += a.calc.ord; h.noct += a.calc.noct; h.ext += a.calc.ext; } if (a.late) h.late += 1; });
      return h;
    },
    payroll: function (s, id) {
      var e = MG.emp(s, id), R = MG.RATES, h = MG.hoursOf(s, id), hr = e.base / R.horasMes;
      var basic = e.base / 2 - h.absent * e.base / 30;
      var ext = h.ext * hr * (1 + R.ext), noct = h.noct * hr * R.noct, dom = h.dom * hr * R.dom, fest = h.fest * hr * R.fest;
      var dev = basic + ext + noct + dom + fest;
      var salud = dev * R.salud, pension = dev * R.pension;
      return { e: e, h: h, hr: hr, basic: basic, ext: ext, noct: noct, dom: dom, fest: fest, aux: R.aux, dev: dev + R.aux, salud: salud, pension: pension, ded: salud + pension, net: dev + R.aux - salud - pension };
    },
    theme: function () { return localStorage.getItem('magnus-theme') || 'light'; },
    setTheme: function (t) { localStorage.setItem('magnus-theme', t); window.dispatchEvent(new Event('magnus-theme')); }
  };
  window.MG = MG;
})();
