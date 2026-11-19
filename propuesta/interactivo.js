(function(){
  var $ = function(s, c){ return (c || document).querySelector(s); };
  var $$ = function(s, c){ return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var pesos = function(n){ return '$ ' + Math.round(n).toLocaleString('es-CO'); };

  /* ---------- 0. Filtro de módulos ---------- */
  $$('#modulos [data-filtro]').forEach(function(b){
    b.addEventListener('click', function(){
      var f = b.dataset.filtro;
      $$('#modulos [data-filtro]').forEach(function(x){ x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); });
      $$('#modulos .mod').forEach(function(m){ m.hidden = !(f === 'todos' || m.dataset.grupo === f); });
    });
  });

  /* ---------- 1. Pedido mayorista: catálogo, presentaciones, stock y descuento por volumen ---------- */
  var CAT = [
    { id:'a1', n:'Aceite de girasol', c:'Despensa', pres:[['Botella 1 L', 9800], ['Caja x 12 (1 L)', 112000], ['Garrafa 5 L', 46500]], stock:{ 0:340, 1:60, 2:48 } },
    { id:'a2', n:'Arroz blanco', c:'Despensa', pres:[['Bolsa 500 g', 2700], ['Paca x 25 (500 g)', 64000], ['Bulto 50 kg', 189000]], stock:{ 0:900, 1:80, 2:35 } },
    { id:'a3', n:'Azúcar refinada', c:'Despensa', pres:[['Bolsa 1 kg', 4300], ['Paca x 10 kg', 41000], ['Bulto 50 kg', 198000]], stock:{ 0:620, 1:70, 2:22 } },
    { id:'a4', n:'Detergente en polvo', c:'Aseo', pres:[['Bolsa 1 kg', 8900], ['Caja x 12', 98000]], stock:{ 0:210, 1:40 } },
    { id:'a5', n:'Jabón líquido para manos', c:'Aseo', pres:[['Frasco 500 ml', 6400], ['Galón 3,8 L', 31000]], stock:{ 0:150, 1:6 } },
    { id:'a6', n:'Vaso desechable 7 oz', c:'Desechables', pres:[['Paquete x 50', 5200], ['Caja x 40 paquetes', 188000]], stock:{ 0:480, 1:25 } },
    { id:'a7', n:'Bolsa de basura industrial', c:'Desechables', pres:[['Paquete x 10', 14500], ['Fardo x 20 paquetes', 270000]], stock:{ 0:95, 1:14 } },
    { id:'a8', n:'Servilleta de papel', c:'Desechables', pres:[['Paquete x 100', 2300], ['Fardo x 50 paquetes', 104000]], stock:{ 0:700, 1:0 } }
  ];
  var cart = {}, catAct = 'Todos', textoBusq = '';
  var TRAMOS = [[3000000, 5], [1000000, 3]];
  function lineaClave(id, k){ return id + ':' + k; }
  function stockDe(p, k){ return p.stock[k] || 0; }
  function pintaCatalogo(){
    var cont = $('#ped-lista'); if (!cont) return;
    var h = '';
    CAT.filter(function(p){
      return (catAct === 'Todos' || p.c === catAct) && (!textoBusq || p.n.toLowerCase().indexOf(textoBusq) > -1);
    }).forEach(function(p){
      h += '<div class="ped-prod" data-id="' + p.id + '"><div class="ped-info"><b>' + p.n + '</b><span>' + p.c + '</span></div>' +
        '<select aria-label="Presentación de ' + p.n + '">' + p.pres.map(function(x, k){ return '<option value="' + k + '">' + x[0] + ' · ' + pesos(x[1]) + '</option>'; }).join('') + '</select>' +
        '<span class="ped-stock" data-stock></span>' +
        '<div class="ped-qty"><button type="button" data-menos aria-label="Menos">−</button><b>1</b><button type="button" data-mas aria-label="Más">+</button></div>' +
        '<button type="button" class="ped-add" data-add>Agregar</button></div>';
    });
    cont.innerHTML = h || '<p class="ped-vacio">Ningún producto coincide con la búsqueda.</p>';
    $$('.ped-prod', cont).forEach(actualizaFila);
  }
  function actualizaFila(fila){
    var p = CAT.filter(function(x){ return x.id === fila.dataset.id; })[0];
    var k = +$('select', fila).value, s = stockDe(p, k), t = $('[data-stock]', fila);
    t.textContent = s === 0 ? 'Agotado' : (s <= 10 ? 'Quedan ' + s : 'Disponible: ' + s);
    t.className = 'ped-stock ' + (s === 0 ? 'rojo' : (s <= 10 ? 'amar' : 'verde'));
    $('[data-add]', fila).disabled = s === 0;
  }
  function pintaCarrito(){
    var lineas = Object.keys(cart), caja = $('#ped-carrito'); if (!caja) return;
    if (!lineas.length){ caja.innerHTML = '<p class="ped-vacio">El pedido está vacío. Agregue productos de la lista.</p>'; $('#ped-total').innerHTML = ''; $('#ped-enviar').disabled = true; return; }
    var sub = 0, h = '';
    lineas.forEach(function(c){
      var l = cart[c], tot = l.q * l.precio; sub += tot;
      h += '<div class="ped-linea"><div><b>' + l.n + '</b><span>' + l.pres + ' × ' + l.q + '</span></div><div class="ped-lt">' + pesos(tot) + '<button type="button" data-quitar="' + c + '" aria-label="Quitar">×</button></div></div>';
    });
    caja.innerHTML = h;
    var pct = 0; TRAMOS.forEach(function(t){ if (!pct && sub >= t[0]) pct = t[1]; });
    var desc = sub * pct / 100;
    $('#ped-total').innerHTML = '<div><span>Subtotal</span><b>' + pesos(sub) + '</b></div>' +
      '<div><span>Descuento por volumen' + (pct ? ' (' + pct + ' %)' : '') + '</span><b>' + (pct ? '− ' + pesos(desc) : '$ 0') + '</b></div>' +
      '<div class="gran"><span>Total</span><b>' + pesos(sub - desc) + '</b></div>' +
      (pct ? '' : '<p class="ped-pista">Desde ' + pesos(TRAMOS[1][0]) + ' el cliente recibe descuento por volumen (tramos de ejemplo, los define Magnus Company).</p>');
    $('#ped-enviar').disabled = false;
  }
  var ped = $('#demo-pedido');
  if (ped){
    var chips = ['Todos'].concat(CAT.map(function(p){ return p.c; }).filter(function(c, i, a){ return a.indexOf(c) === i; }));
    $('#ped-cats').innerHTML = chips.map(function(c, i){ return '<button type="button" class="' + (i ? '' : 'on') + '" data-cat="' + c + '" aria-pressed="' + (i === 0) + '">' + c + '</button>'; }).join('');
    $('#ped-cats').addEventListener('click', function(e){
      var b = e.target.closest('[data-cat]'); if (!b) return;
      catAct = b.dataset.cat;
      $$('#ped-cats button').forEach(function(x){ x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); });
      pintaCatalogo();
    });
    $('#ped-buscar').addEventListener('input', function(e){ textoBusq = e.target.value.trim().toLowerCase(); pintaCatalogo(); });
    $('#ped-lista').addEventListener('change', function(e){ var f = e.target.closest('.ped-prod'); if (f) actualizaFila(f); });
    $('#ped-lista').addEventListener('click', function(e){
      var f = e.target.closest('.ped-prod'); if (!f) return;
      var q = $('.ped-qty b', f);
      if (e.target.closest('[data-menos]')) q.textContent = Math.max(1, +q.textContent - 1);
      if (e.target.closest('[data-mas]')) q.textContent = Math.min(999, +q.textContent + 1);
      if (e.target.closest('[data-add]')){
        var p = CAT.filter(function(x){ return x.id === f.dataset.id; })[0], k = +$('select', f).value, c = lineaClave(p.id, k);
        var ya = cart[c] ? cart[c].q : 0, q2 = +q.textContent, disp = stockDe(p, k), aviso = $('#ped-aviso');
        if (ya + q2 > disp){
          aviso.textContent = 'Solo hay ' + disp + ' disponibles de «' + p.n + ' · ' + p.pres[k][0] + '». El sistema no deja vender más de lo que hay.';
          aviso.hidden = false; return;
        }
        aviso.hidden = true;
        cart[c] = { n: p.n, pres: p.pres[k][0], precio: p.pres[k][1], q: ya + q2, pid: p.id, k: k };
        $('#ped-ok').hidden = true; q.textContent = '1'; pintaCarrito();
      }
    });
    $('#ped-carrito').addEventListener('click', function(e){ var b = e.target.closest('[data-quitar]'); if (b){ delete cart[b.dataset.quitar]; pintaCarrito(); } });
    $('#ped-enviar').addEventListener('click', function(){
      var n = Object.keys(cart).length;
      Object.keys(cart).forEach(function(c){ var l = cart[c], p = CAT.filter(function(x){ return x.id === l.pid; })[0]; p.stock[l.k] = Math.max(0, stockDe(p, l.k) - l.q); });
      cart = {}; pintaCarrito(); pintaCatalogo();
      var ok = $('#ped-ok'); ok.innerHTML = '<b>Pedido enviado a bodega</b><span>' + n + (n === 1 ? ' línea' : ' líneas') + ' en alistamiento. El inventario ya descontó lo vendido y el cliente quedó en su historial.</span>'; ok.hidden = false;
    });
    pintaCatalogo(); pintaCarrito();
  }

  /* ---------- 2. Inventario por lotes y fechas de vencimiento (primero vence, primero sale) ---------- */
  var LOTES = [
    { l:'L-2410-B', d:-3, q:12 }, { l:'L-2411-A', d:9, q:40 }, { l:'L-2412-C', d:34, q:120 }, { l:'L-2502-A', d:118, q:300 }
  ];
  var inv = $('#demo-lotes');
  function fechaEn(d){ var x = new Date(); x.setDate(x.getDate() + d); return x.toLocaleDateString('es-CO', { day:'numeric', month:'short', year:'numeric' }); }
  function pintaLotes(res){
    var h = LOTES.map(function(x){
      var est = x.d < 0 ? ['vencido', 'rojo', 'Vencido hace ' + (-x.d) + ' días'] : (x.d <= 15 ? ['por vencer', 'rojo', 'Vence en ' + x.d + ' días'] : (x.d <= 45 ? ['pronto', 'amar', 'Vence en ' + x.d + ' días'] : ['ok', 'verde', 'Vence en ' + x.d + ' días']));
      var sale = res && res[x.l] ? '<em>− ' + res[x.l] + '</em>' : '';
      return '<div class="lote ' + est[1] + '"><div><b>' + x.l + '</b><span>' + fechaEn(x.d) + ' · ' + est[2] + '</span></div><div class="lote-q">' + x.q + ' un. ' + sale + '</div></div>';
    }).join('');
    $('#lotes-lista').innerHTML = h;
    var total = LOTES.filter(function(x){ return x.d >= 0; }).reduce(function(a, x){ return a + x.q; }, 0);
    $('#lotes-total').textContent = total + ' unidades vendibles (' + LOTES.filter(function(x){ return x.d < 0; }).reduce(function(a, x){ return a + x.q; }, 0) + ' vencidas, bloqueadas para la venta)';
  }
  if (inv){
    pintaLotes();
    $('#lotes-form').addEventListener('submit', function(e){
      e.preventDefault();
      var pide = Math.max(1, +$('#lotes-q').value || 0), res = {}, falta = pide;
      var disp = LOTES.filter(function(x){ return x.d >= 0; }).sort(function(a, b){ return a.d - b.d; });
      var msg = $('#lotes-msg');
      var total = disp.reduce(function(a, x){ return a + x.q; }, 0);
      if (pide > total){ msg.innerHTML = '<b>No alcanza</b><span>Solo hay ' + total + ' unidades vendibles. El sistema avisa antes de prometerle al cliente algo que no tiene.</span>'; msg.hidden = false; return; }
      var partes = [];
      disp.forEach(function(x){ if (falta > 0){ var t = Math.min(falta, x.q); res[x.l] = t; falta -= t; partes.push(t + ' del lote ' + x.l); } });
      pintaLotes(res);
      msg.innerHTML = '<b>Despacho de ' + pide + ' unidades</b><span>Sale primero lo que vence primero: ' + partes.join(' y ') + '. Así no se pierde mercancía por vencimiento. (Demostración: no descuenta de verdad.)</span>'; msg.hidden = false;
    });
  }

  /* ---------- 3. Conductores y GPS (simulado) ---------- */
  var gps = $('#demo-gps');
  if (gps){
    var RUTAS = [
      { id:'c1', n:'Carlos R.', cli:'Restaurante La Esquina', eta:14, d:'M30 150 L30 110 L90 110 L90 60 L170 60' },
      { id:'c2', n:'Andrés M.', cli:'Tienda Villa Real', eta:22, d:'M30 150 L110 150 L110 100 L210 100 L210 40 L270 40' },
      { id:'c3', n:'Julián P.', cli:'Hotel Santa Clara', eta:31, d:'M30 150 L150 150 L150 170 L250 170 L250 110 L290 110' }
    ];
    var estado = { c1:'En ruta', c2:'En ruta', c3:'Por salir' }, sel = 'c1', t0 = performance.now();
    var svg = $('#gps-svg'), NS = 'http://www.w3.org/2000/svg';
    var grid = ''; for (var gx = 20; gx <= 300; gx += 40) grid += '<line x1="' + gx + '" y1="10" x2="' + gx + '" y2="190"/>'; for (var gy = 20; gy <= 190; gy += 40) grid += '<line x1="10" y1="' + gy + '" x2="310" y2="' + gy + '"/>';
    svg.innerHTML = '<g class="g-grid">' + grid + '</g>' + RUTAS.map(function(r){ return '<path class="g-ruta" id="gr-' + r.id + '" d="' + r.d + '"/>'; }).join('') +
      '<g class="g-bodega"><rect x="18" y="140" width="24" height="20" rx="3"/></g><text x="30" y="177" text-anchor="middle" class="g-lbl">Bodega</text>' +
      RUTAS.map(function(r){ return '<circle class="g-punto" id="gp-' + r.id + '" r="7"/>'; }).join('');
    var rapido = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function mueve(ts){
      RUTAS.forEach(function(r, i){
        var path = $('#gr-' + r.id), len = path.getTotalLength(), p;
        if (estado[r.id] === 'Entregado') p = len; else if (estado[r.id] === 'Por salir') p = 0; else p = rapido ? len * 0.55 : (((ts - t0) / (9000 + i * 2500)) % 1) * len;
        var pt = path.getPointAtLength(p), c = $('#gp-' + r.id); c.setAttribute('cx', pt.x); c.setAttribute('cy', pt.y);
        c.setAttribute('class', 'g-punto' + (r.id === sel ? ' sel' : '') + (estado[r.id] === 'Entregado' ? ' hecho' : ''));
      });
      if (!rapido) requestAnimationFrame(mueve);
    }
    function pintaEntregas(){
      $('#gps-lista').innerHTML = RUTAS.map(function(r){
        var e = estado[r.id];
        return '<div class="ent' + (r.id === sel ? ' on' : '') + '" data-id="' + r.id + '" tabindex="0" role="button"><div><b>' + r.n + '</b><span>' + r.cli + '</span></div><div class="ent-der"><span class="est ' + (e === 'Entregado' ? 'verde' : (e === 'En ruta' ? 'amar' : 'gris')) + '">' + e + '</span><small>' + (e === 'En ruta' ? 'Llega en ~' + r.eta + ' min' : (e === 'Entregado' ? 'Firma y foto recibidas' : 'Sale en 10 min')) + '</small></div></div>';
      }).join('');
    }
    $('#gps-lista').addEventListener('click', function(e){ var f = e.target.closest('.ent'); if (f){ sel = f.dataset.id; pintaEntregas(); updAcc(); if (rapido) mueve(performance.now()); } });
    $('#gps-lista').addEventListener('keydown', function(e){ if (e.key === 'Enter' || e.key === ' '){ var f = e.target.closest('.ent'); if (f){ e.preventDefault(); f.click(); } } });
    function updAcc(){ var e = estado[sel], r = RUTAS.filter(function(x){ return x.id === sel; })[0]; var b = $('#gps-accion'); b.textContent = e === 'Por salir' ? 'Marcar «En ruta»' : (e === 'En ruta' ? 'Marcar «Entregado»' : 'Entrega cerrada ✓'); b.disabled = e === 'Entregado'; $('#gps-det').textContent = r.n + ' · ' + r.cli; }
    $('#gps-accion').addEventListener('click', function(){ estado[sel] = estado[sel] === 'Por salir' ? 'En ruta' : 'Entregado'; pintaEntregas(); updAcc(); if (rapido) mueve(performance.now()); });
    pintaEntregas(); updAcc(); requestAnimationFrame(mueve);
  }

  /* ---------- 4. Agendar la reunión ---------- */
  var dias = $('#ag-dias');
  if (dias){
    var d = new Date(), html = '', n = 0;
    while (n < 6){
      d.setDate(d.getDate() + 1);
      if (d.getDay() === 0) continue;
      var etiqueta = d.toLocaleDateString('es-CO', { weekday:'long', day:'numeric', month:'long' });
      html += '<button type="button" class="ag-op' + (n === 0 ? ' on' : '') + '" data-dia="' + etiqueta + '" aria-pressed="' + (n === 0) + '"><b>' + d.toLocaleDateString('es-CO', { weekday:'short' }) + '</b><span>' + d.getDate() + ' ' + d.toLocaleDateString('es-CO', { month:'short' }) + '</span></button>';
      n++;
    }
    dias.innerHTML = html;
  }
  function elegido(grupo){ var b = $('#' + grupo + ' .on'); return b ? (b.dataset.dia || b.dataset.val) : ''; }
  function mensaje(){
    var txt = 'Hola, somos Magnus Company. Revisamos la propuesta de SYSMOOO y queremos agendar la reunión para ver el sistema funcionando: el ' + elegido('ag-dias') + ', en la ' + elegido('ag-franja') + ', ' + elegido('ag-modo') + '.';
    var m = $('#ag-msg'); if (m) m.textContent = txt;
  }
  $$('#agenda .ag-grupo').forEach(function(g){
    g.addEventListener('click', function(e){
      var b = e.target.closest('.ag-op'); if (!b) return;
      $$('.ag-op', g).forEach(function(x){ x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); });
      mensaje();
    });
  });
  var copiar = $('#ag-copiar');
  if (copiar){
    mensaje();
    copiar.addEventListener('click', function(){
      var txt = $('#ag-msg').textContent;
      var hecho = function(){ copiar.textContent = 'Copiado ✓'; setTimeout(function(){ copiar.textContent = 'Copiar mensaje'; }, 2200); };
      var fallback = function(){ var r = document.createRange(); r.selectNodeContents($('#ag-msg')); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); copiar.textContent = 'Texto seleccionado: cópialo'; };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(hecho, fallback); else fallback();
    });
  }
})();
