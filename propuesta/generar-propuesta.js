// Uso (desde esta carpeta): node generar-propuesta.js
// Genera la propuesta de Magnus Company Colombia: versión local, cloudflare/index.html (noindex) y versión para link de Claude.
// Base visual: plantilla 04 del ecosistema (igual que las demás propuestas). Las demos interactivas viven en interactivo.js.
// Magnus Company: proveedor mayorista (más de 800 productos). Sin precio ni forma de pago en el documento. Entrega por fases, sin plazo fijo hasta el diagnóstico.
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..', '..') + '/';
const DIR = __dirname + '/';
const tpl = fs.readFileSync(ROOT + 'ecosistema/html/04-propuesta-y-alcance.html', 'utf8').split('\n');
const idx = fs.readFileSync(ROOT + 'ecosistema/html/00-indice-ecosistema.html', 'utf8').split('\n');
const imgEst = idx[134], imgPro = idx[139], imgDev = idx[144];

const sysmoB64 = 'data:image/png;base64,' + fs.readFileSync(ROOT + 'recursos/sysmo-logo.png').toString('base64');
const sysmo = (cls) => '<img class="' + cls + '" src="' + sysmoB64 + '" alt="SYSMOOO">';
const fotoB64 = 'data:image/png;base64,' + fs.readFileSync(ROOT + 'clientes/magnus-company/marca/logo-magnus-simbolo.png').toString('base64');
const foto = (cls) => `<img class="${cls}" src="${fotoB64}" alt="Magnus Company">`;
const HOJA = `<svg class="hoja" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20c0-8 6-14 16-16-1 10-7 16-15 16"/><path d="M5 19c4-5 7-8 11-11"/></svg>`;

const cssEnd = tpl.findIndex(l => l.trim() === '</style>');
const head = tpl.slice(0, cssEnd).join('\n').replace('<title>SYSMOOO — Propuesta y alcance</title>', "<title>Propuesta Magnus Company</title>");

const css = `
  /* ===== Personalización Magnus Company ===== */
  :root{ color-scheme:dark; }
  [hidden]{ display:none !important; }
  .reveal{ opacity:1; transform:none; }
  .anim .reveal:not(.in){ opacity:0; transform:translateY(26px); }
  .hoja{ width:17px; height:17px; fill:none; stroke:var(--amore-light); stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; display:block; margin-top:3px; }
  .chapter-num{ display:inline-flex; align-items:center; gap:8px; }
  .chapter-num::before{ content:""; width:8px; height:8px; border-radius:50%; background:var(--amore); }

  /* topnav */
  .topnav .brand img{ height:20px; width:auto; filter:invert(1); }
  .topnav .client{ display:flex; align-items:center; gap:10px; font-size:12px; font-weight:700; color:var(--text-dim); letter-spacing:0.04em; }
  .topnav .client img{ width:34px; height:34px; object-fit:cover; object-position:50% 50%; border-radius:50%; border:1px solid var(--owner-color-dim); }
  @media (max-width:640px){ .topnav .client span, .topnav .brand .doc-name{ display:none; } }

  /* portada */
  .hero-doc .wrap{ grid-template-columns:1fr minmax(0,470px); }
  @media (max-width:900px){ .hero-doc .wrap{ grid-template-columns:1fr; } }
  .portada-foto{ position:relative; z-index:2; }
  .portada-foto .halo{ position:absolute; inset:-30px; border-radius:40px; background:radial-gradient(closest-side, rgba(217,30,38,.28), rgba(217,30,38,0)); }
  .portada-foto .marco{ position:relative; border-radius:50%; overflow:hidden; box-shadow:0 30px 70px rgba(0,0,0,.6), 0 0 0 6px rgba(217,30,38,.35); aspect-ratio:1/1; width:min(100%,360px); margin-inline:auto; background:#000; }
  .portada-foto .marco img{ width:100%; height:100%; object-fit:cover; display:block; }
  .anim .portada-foto .marco{ animation:fotoIn 1.1s var(--ease-spring) both .15s; }
  .anim .portada-foto .marco img{ animation:none; }
  @keyframes fotoIn{ from{ opacity:0; transform:translateY(30px) scale(.94); } to{ opacity:1; transform:none; } }
  @keyframes kenburns{ from{ transform:scale(1); } to{ transform:scale(1.08) translateX(-2%); } }
  .anim .hero-copy > *{ animation:heroUp .8s var(--ease-out) both; }
  .anim .hero-copy > *:nth-child(2){ animation-delay:.12s; } .anim .hero-copy > *:nth-child(3){ animation-delay:.24s; } .anim .hero-copy > *:nth-child(4){ animation-delay:.36s; } .anim .hero-copy > *:nth-child(5){ animation-delay:.46s; }
  @keyframes heroUp{ from{ opacity:0; transform:translateY(18px); } to{ opacity:1; transform:none; } }
  .hero-cta{ display:flex; flex-wrap:wrap; gap:10px; margin-top:22px; }
  .boton{ display:inline-flex; align-items:center; gap:10px; padding:12px 20px; border-radius:999px; font:inherit; font-size:14px; font-weight:700; text-decoration:none; cursor:pointer; border:1px solid var(--owner-color-dim); background:var(--owner-color-soft); color:var(--text); transition:transform .3s var(--ease-out), background .3s var(--ease-out); }
  .boton.lleno{ background:var(--text); color:var(--bg); border-color:var(--text); }
  @media (hover:hover) and (pointer:fine){ .boton:hover{ transform:translateY(-2px); } }
  .cobrand{ display:flex; align-items:center; gap:12px; margin-top:28px; font-size:12px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:var(--text-dim); }
  .cobrand .pill{ display:inline-flex; align-items:center; gap:8px; } .cobrand .pill i{ width:8px; height:8px; border-radius:50%; background:var(--amore); }
  .sysmo-mark{ height:16px; width:auto; filter:invert(1); display:block; } .sysmo-mark.big{ height:30px; }
  .vapor{ display:block; width:100%; height:64px; margin-top:-18px; position:relative; z-index:1; }
  .vapor path{ fill:none; stroke:rgba(255,90,95,.4); stroke-width:1.6; stroke-linecap:round; }
  .anim .vapor path{ stroke-dasharray:900; stroke-dashoffset:900; animation:dibujar 2.6s var(--ease-out) forwards .6s; }
  @keyframes dibujar{ to{ stroke-dashoffset:0; } }

  /* gigantes */
  .giants-strip{ display:grid; grid-template-columns:repeat(3,1fr); gap:22px; margin-top:34px; }
  .giant-block{ display:flex; flex-direction:column; align-items:center; text-align:center; }
  .giant-block .fig{ position:relative; width:100%; height:260px; display:flex; align-items:flex-end; justify-content:center; }
  .giant-block .fig img{ height:260px; width:auto; max-width:100%; object-fit:contain; filter:drop-shadow(0 18px 24px rgba(0,0,0,.5)); transition:opacity .5s var(--ease-out), transform .9s var(--ease-spring); }
  .anim .giant-block:not(.in) .fig img{ opacity:0; transform:translateY(-60px); }
  .giant-block .label{ display:flex; align-items:center; gap:10px; margin-top:16px; }
  .giant-block .num{ font-family:var(--font-display); font-size:14px; font-weight:900; color:var(--text-dim); }
  .giant-block .name-tag{ font-family:var(--font-display); font-size:15px; font-weight:700; }
  .giant-block .dot, .area-dot{ width:9px; height:9px; border-radius:50%; display:inline-block; }
  .giant-block.est .dot, .area-dot.est{ background:var(--purple); } .giant-block.pro .dot, .area-dot.pro{ background:var(--orange); } .giant-block.dev .dot, .area-dot.dev{ background:var(--lime); }
  .giant-block .role{ font-size:13.5px; color:var(--text-dim); margin-top:8px; max-width:290px; line-height:1.6; }
  .swipe-hint{ display:none; }

  .statement{ font-family:var(--font-display); font-weight:700; font-size:clamp(20px,2.8vw,26px); line-height:1.3; letter-spacing:-0.01em; max-width:780px; margin:6px 0 18px; }
  .statement .hoja{ display:inline-block; width:22px; height:22px; margin:0 10px 0 0; vertical-align:-3px; }
  .tarjeta{ border:1px solid var(--line); border-radius:20px; padding:28px; background:var(--surface); }
  .badge{ display:inline-flex; align-items:center; gap:8px; font-size:11px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:var(--text-dim); border:1px solid var(--line); border-radius:999px; padding:6px 14px; margin-bottom:16px; }
  .badge i{ width:8px; height:8px; border-radius:50%; background:var(--amore); }
  .badge.vivo i{ animation:latido 2s infinite; }
  @keyframes latido{ 0%{ box-shadow:0 0 0 0 rgba(255,90,95,.55); } 70%{ box-shadow:0 0 0 9px rgba(255,90,95,0); } 100%{ box-shadow:0 0 0 0 rgba(255,90,95,0); } }
  .demo-nota{ font-size:12px; color:var(--text-dim); margin-top:12px; display:flex; gap:8px; align-items:center; }
  .demo-nota::before{ content:""; width:8px; height:8px; border-radius:2px; background:var(--amore); flex:none; }

  /* 03 recorrido */
  .rec{ display:grid; grid-template-columns:minmax(0,300px) minmax(0,1fr); gap:22px; margin-top:26px; }
  .rec-pasos{ display:flex; flex-direction:column; gap:6px; }
  .rec-pasos button{ display:flex; gap:12px; align-items:center; text-align:left; background:transparent; color:var(--text-dim); border:1px solid transparent; border-radius:12px; padding:11px 12px; font:inherit; font-size:14px; font-weight:600; cursor:pointer; transition:background .3s var(--ease-out), color .3s var(--ease-out); }
  .rec-pasos button b{ font-family:var(--font-display); font-size:12px; width:22px; flex:none; }
  .rec-pasos button.on{ background:var(--surface); color:var(--text); border-color:var(--owner-color-dim); }
  .rec-panel{ border:1px solid var(--line); border-radius:20px; background:var(--surface); padding:28px; min-height:300px; display:flex; flex-direction:column; }
  .rec-panel [data-panel]{ animation:panelIn .5s var(--ease-out); }
  @keyframes panelIn{ from{ opacity:0; transform:translateY(10px); } to{ opacity:1; transform:none; } }
  .rec-panel .quien{ font-size:11px; font-weight:800; letter-spacing:.1em; text-transform:uppercase; color:var(--text-dim); display:flex; gap:8px; align-items:center; margin-bottom:10px; }
  .rec-panel h4{ font-family:var(--font-display); font-size:clamp(19px,2.4vw,24px); margin:0 0 10px; letter-spacing:-0.01em; }
  .rec-panel p{ color:var(--text-dim); font-size:15px; line-height:1.7; margin:0 0 14px; max-width:560px; }
  .rec-panel .modulo{ display:inline-flex; gap:8px; align-items:center; font-size:12.5px; font-weight:700; border:1px solid var(--line); border-radius:999px; padding:5px 12px; margin:0 6px 6px 0; }
  .rec-pie{ margin-top:auto; display:flex; align-items:center; gap:14px; padding-top:16px; }
  .rec-barra{ flex:1; height:4px; border-radius:2px; background:var(--line); overflow:hidden; }
  .rec-barra i{ display:block; height:100%; width:0; background:var(--amore); transition:width .5s var(--ease-out); }
  .rec-pie button{ background:transparent; border:1px solid var(--line); color:var(--text); border-radius:999px; padding:6px 14px; font:inherit; font-size:12.5px; font-weight:700; cursor:pointer; }

  /* 05 módulos */
  .filtros-mod{ display:flex; flex-wrap:wrap; gap:8px; margin:22px 0 16px; }
  .filtros-mod button{ background:var(--surface); color:var(--text-dim); border:1px solid var(--line); border-radius:999px; padding:8px 16px; font:inherit; font-size:13px; font-weight:700; cursor:pointer; }
  .filtros-mod button.on{ background:var(--owner-color-soft); color:var(--text); border-color:var(--owner-color-dim); }
  .mods{ display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; }
  .mod{ border:1px solid var(--line); border-radius:16px; background:var(--surface); overflow:hidden; transition:border-color .3s var(--ease-out); }
  .mod[open]{ border-color:var(--owner-color-dim); grid-column:span 1; }
  .mod summary{ list-style:none; cursor:pointer; padding:18px; display:flex; flex-direction:column; gap:6px; }
  .mod summary::-webkit-details-marker{ display:none; }
  .mod .grupo{ font-size:10.5px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; color:var(--text-dim); display:flex; gap:7px; align-items:center; }
  .mod .grupo i{ width:7px; height:7px; border-radius:50%; background:var(--c); }
  .mod b{ font-family:var(--font-display); font-size:15px; font-weight:700; color:var(--text); }
  .mod summary span.res{ font-size:13.5px; color:var(--text-dim); line-height:1.55; }
  .mod summary .mas{ font-size:12px; font-weight:700; color:var(--text-dim); margin-top:4px; }
  .mod[open] summary .mas{ display:none; }
  .mod ul{ margin:0; padding:0 18px 18px 36px; display:grid; gap:6px; font-size:13.5px; color:var(--text-dim); line-height:1.55; }
  .mod li b{ font-family:inherit; font-size:inherit; }
  .g-cli{ --c:var(--amore); } .g-eq{ --c:var(--orange); } .g-adm{ --c:var(--lime); }

  /* demos: marcos */
  .demo{ display:grid; grid-template-columns:minmax(0,1.25fr) minmax(0,1fr); gap:22px; margin-top:24px; align-items:start; }
  .navegador{ border:1px solid var(--line); border-radius:16px; overflow:hidden; background:#F4F2EC; color:#111111; box-shadow:0 24px 50px rgba(0,0,0,.4); }
  .nav-barra{ display:flex; align-items:center; gap:6px; padding:9px 12px; background:#1f1c22; }
  .nav-barra i{ width:9px; height:9px; border-radius:50%; background:#4a454f; }
  .nav-barra span{ margin-left:10px; flex:1; background:#2c2830; color:#bdb5c2; font-size:11.5px; border-radius:6px; padding:4px 10px; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }
  .sitio-top{ display:flex; align-items:center; justify-content:space-between; gap:10px; padding:12px 16px; border-bottom:1px solid rgba(43,36,32,.12); flex-wrap:wrap; }
  .sitio-top b{ font-family:'Unbounded', Georgia, serif; font-weight:800; font-size:17px; letter-spacing:-.01em; }
  .sitio-tabs{ display:flex; gap:4px; }
  .sitio-tabs button{ background:transparent; border:0; color:#5a4d43; font:inherit; font-size:13px; font-weight:700; padding:6px 10px; border-radius:999px; cursor:pointer; }
  .sitio-tabs button.on{ background:#111111; color:#F4F2EC; }
  .sitio-cuerpo{ padding:18px 16px 20px; min-height:300px; }
  .sitio-hero{ border-radius:12px; overflow:hidden; position:relative; aspect-ratio:16/7; }
  .sitio-hero img{ width:100%; height:100%; object-fit:cover; }
  .sitio-hero .cta-sitio{ position:absolute; right:12px; bottom:12px; display:flex; gap:6px; }
  .sitio-hero .cta-sitio button{ background:#111111; color:#F4F2EC; border:0; border-radius:999px; padding:7px 12px; font:inherit; font-size:12px; font-weight:700; cursor:pointer; }
  .sitio-hero.hero-logo{ background:#000; display:grid; place-items:center; }
  .sitio-hero.hero-logo > img{ width:auto; height:84%; max-width:60%; object-fit:contain; }
  .sitio-txt{ font-size:13.5px; line-height:1.6; margin:12px 0 0; color:#4b4038; }
  .form-sitio{ display:grid; grid-template-columns:1fr 1fr; gap:10px; }
  .form-sitio label{ display:flex; flex-direction:column; gap:4px; font-size:11.5px; font-weight:700; color:#5a4d43; }
  .form-sitio input, .form-sitio select{ background:#fff; color:#111111; border:1px solid rgba(43,36,32,.2); border-radius:8px; padding:8px 9px; font:inherit; font-size:13px; }
  .form-sitio .ancho{ grid-column:1 / -1; }
  .stepper{ display:flex; align-items:center; gap:8px; } .stepper button{ width:30px; height:30px; border-radius:8px; border:1px solid rgba(43,36,32,.2); background:#fff; color:#111111; font:inherit; font-weight:800; cursor:pointer; } .stepper b{ min-width:22px; text-align:center; font-size:15px; }
  .form-sitio .enviar{ grid-column:1 / -1; background:#111111; color:#F4F2EC; border:0; border-radius:10px; padding:11px; font:inherit; font-weight:800; cursor:pointer; }
  .ok-sitio{ grid-column:1 / -1; background:#fff; border:1px solid rgba(43,36,32,.15); border-radius:10px; padding:10px 12px; font-size:13px; color:#111111; }
  .ok-sitio b{ display:block; margin-bottom:2px; }
  .panel-adm{ border:1px solid var(--line); border-radius:16px; background:var(--surface); padding:18px; }
  .panel-adm h5{ font-family:var(--font-display); font-size:14px; margin:0 0 4px; } .panel-adm > p{ font-size:12.5px; color:var(--text-dim); margin:0 0 12px; }
  .pan-fila{ display:grid; grid-template-columns:minmax(0,1fr) auto; gap:2px 10px; padding:10px 0; border-top:1px solid var(--line); font-size:13px; }
  .pan-fila b{ font-weight:700; } .pan-fila span{ grid-column:1; color:var(--text-dim); font-size:12px; }
  .pan-fila em{ grid-row:1 / span 2; grid-column:2; align-self:center; font-style:normal; font-size:11px; font-weight:800; letter-spacing:.06em; text-transform:uppercase; border:1px solid var(--owner-color-dim); border-radius:999px; padding:3px 9px; }
  .pan-fila.nueva{ animation:entraFila .6s var(--ease-spring); }
  @keyframes entraFila{ from{ opacity:0; transform:translateX(-14px); background:var(--owner-color-soft); } to{ opacity:1; transform:none; } }
  .vacio{ font-size:12.5px; color:var(--text-dim); padding:12px 0; border-top:1px solid var(--line); }

  /* demo menú */
  .demo-menu{ display:grid; grid-template-columns:minmax(0,300px) minmax(0,1fr); gap:22px; margin-top:24px; align-items:start; }
  .celular{ width:100%; max-width:300px; border-radius:34px; border:8px solid #0d0c10; background:#F4F2EC; color:#111111; overflow:hidden; box-shadow:0 30px 60px rgba(0,0,0,.5); margin:0 auto; }
  .cel-top{ padding:14px 14px 8px; display:flex; align-items:center; justify-content:space-between; }
  .cel-top b{ font-family:'Unbounded', Georgia, serif; font-weight:800; font-size:15px; }
  .cel-top small{ font-size:11px; font-weight:700; color:#5a4d43; }
  .cats{ display:flex; gap:6px; overflow-x:auto; padding:2px 12px 10px; scrollbar-width:none; }
  .cats::-webkit-scrollbar{ display:none; }
  .cats button{ flex:none; background:#fff; color:#5a4d43; border:1px solid rgba(43,36,32,.15); border-radius:999px; padding:6px 11px; font:inherit; font-size:12px; font-weight:700; cursor:pointer; }
  .cats button.on{ background:#111111; color:#F4F2EC; }
  .platos{ padding:0 12px; display:grid; gap:8px; min-height:236px; align-content:start; }
  .plato{ display:grid; grid-template-columns:minmax(0,1fr) auto; gap:8px; align-items:center; background:#fff; border-radius:12px; padding:10px; }
  .plato b{ font-size:13px; display:block; } .plato span{ font-size:11.5px; color:#6c5e53; line-height:1.4; display:block; }
  .plato button{ background:#111111; color:#F4F2EC; border:0; border-radius:999px; width:32px; height:32px; font:inherit; font-size:18px; font-weight:700; cursor:pointer; transition:transform .25s var(--ease-spring); }
  .plato button.pulso{ transform:scale(1.25); }
  .cel-pie{ padding:12px; }
  .cel-pie button{ width:100%; background:#111111; color:#F4F2EC; border:0; border-radius:12px; padding:12px; font:inherit; font-size:13px; font-weight:800; cursor:pointer; }
  .cel-pie button:disabled{ opacity:.45; cursor:default; }
  .carrito-n{ display:inline-grid; place-items:center; min-width:22px; height:22px; border-radius:999px; background:#111111; color:#F4F2EC; font-size:11px; font-weight:800; }
  .pantallas{ display:grid; gap:14px; }
  .kds{ display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:10px; }
  .ticket{ border:1px solid var(--line); border-radius:12px; background:var(--bg); padding:12px; }
  .ticket.nuevo{ animation:entraFila .6s var(--ease-spring); }
  .ticket.listo{ border-color:var(--lime); }
  .tk-cab{ display:flex; justify-content:space-between; align-items:baseline; margin-bottom:8px; } .tk-cab b{ font-family:var(--font-display); font-size:14px; } .tk-t{ font-size:11.5px; color:var(--text-dim); }
  .ticket ul{ margin:0; padding:0; list-style:none; display:grid; gap:6px; }
  .ticket li{ display:flex; justify-content:space-between; gap:8px; align-items:center; font-size:13px; }
  .ticket li.hecho span{ text-decoration:line-through; color:var(--text-dim); }
  .ok-plato{ background:var(--surface-2); color:var(--text); border:1px solid var(--line); border-radius:8px; padding:3px 9px; font:inherit; font-size:11.5px; font-weight:700; cursor:pointer; }
  .tv{ border-radius:14px; background:#0e0d10; border:6px solid #2a2730; padding:14px; }
  .tv-tit{ font-size:11px; font-weight:800; letter-spacing:.1em; text-transform:uppercase; color:var(--text-dim); margin-bottom:10px; }
  .tv-grid{ display:grid; grid-template-columns:repeat(auto-fill,minmax(130px,1fr)); gap:8px; }
  .tv-mesa{ border-radius:10px; padding:10px; background:var(--surface); border-left:4px solid var(--orange); }
  .tv-mesa.lista{ border-left-color:var(--lime); }
  .tv-mesa b{ display:block; font-family:var(--font-display); font-size:13px; } .tv-mesa span{ font-size:12px; color:var(--text-dim); }

  /* simulador de propinas */
  .prop{ display:grid; grid-template-columns:minmax(0,320px) minmax(0,1fr); gap:22px; margin-top:24px; }
  .prop-ctrl{ display:grid; gap:16px; align-content:start; }
  .prop-ctrl label.l{ font-size:11.5px; font-weight:800; letter-spacing:.06em; text-transform:uppercase; color:var(--text-dim); display:flex; justify-content:space-between; margin-bottom:6px; }
  .prop-ctrl input[type=number]{ width:100%; background:var(--bg); color:var(--text); border:1px solid var(--line); border-radius:10px; padding:11px 12px; font:inherit; font-size:17px; font-weight:800; }
  .prop-ctrl input[type=range]{ width:100%; accent-color:var(--amore); }
  .modos{ display:flex; flex-wrap:wrap; gap:6px; }
  .modos button{ background:var(--bg); color:var(--text-dim); border:1px solid var(--line); border-radius:999px; padding:7px 12px; font:inherit; font-size:12.5px; font-weight:700; cursor:pointer; }
  .modos button.on{ background:var(--owner-color-soft); color:var(--text); border-color:var(--owner-color-dim); }
  .prop-res{ display:flex; gap:18px; flex-wrap:wrap; font-size:13px; color:var(--text-dim); }
  .prop-res b{ display:block; font-family:var(--font-display); font-size:20px; color:var(--text); font-variant-numeric:tabular-nums; }
  .pe-fila{ display:grid; grid-template-columns:110px 84px minmax(0,1fr) 110px; gap:12px; align-items:center; padding:10px 0; border-top:1px solid var(--line); }
  .pe-n b{ display:block; font-size:14px; } .pe-n span{ font-size:12px; color:var(--text-dim); }
  .pe-c{ display:flex; flex-direction:column; gap:3px; font-size:10.5px; font-weight:800; letter-spacing:.06em; text-transform:uppercase; color:var(--text-dim); }
  .pe-c input{ width:100%; background:var(--bg); color:var(--text); border:1px solid var(--line); border-radius:8px; padding:6px 8px; font:inherit; font-size:14px; font-weight:700; }
  .pe-c[hidden]{ display:none; }
  .pe-barra{ height:12px; border-radius:6px; background:var(--surface-2); overflow:hidden; }
  .pe-barra i{ display:block; height:100%; width:0; background:var(--amore); border-radius:6px; transition:width .5s var(--ease-out); }
  .pe-v{ text-align:right; font-family:var(--font-display); font-weight:700; font-size:14px; font-variant-numeric:tabular-nums; }
  .aviso-prop{ font-size:12.5px; color:var(--text-dim); border-left:3px solid var(--orange); padding-left:10px; margin-top:10px; }

  /* lista de valor, tiempos, entregables */
  .field-row .fnum{ color:var(--amore-light); }
  .semanas{ display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:12px; margin-top:26px; position:relative; }
  .semana{ border:1px solid var(--line); border-radius:16px; padding:20px; background:var(--surface); position:relative; }
  .semana .wk{ font-family:var(--font-display); font-weight:800; font-size:12px; color:var(--text-dim); letter-spacing:.06em; text-transform:uppercase; display:flex; align-items:center; gap:8px; }
  .semana .wk i{ width:9px; height:9px; border-radius:50%; background:var(--amore); }
  .semana h4{ font-family:var(--font-display); font-size:15.5px; margin:10px 0 10px; }
  .semana ul{ margin:0; padding:0; list-style:none; } .semana li{ display:flex; gap:9px; font-size:13px; color:var(--text-dim); padding:7px 0; border-top:1px solid var(--line); line-height:1.5; } .semana li:first-child{ border-top:0; } .semana li .area-dot{ margin-top:6px; flex:none; }
  .linea-30{ display:flex; align-items:center; gap:12px; margin-top:18px; font-size:13px; color:var(--text-dim); }
  .linea-30 .pista{ flex:1; height:6px; border-radius:3px; background:var(--line); overflow:hidden; }
  .linea-30 .pista i{ display:block; height:100%; width:100%; background:var(--amore); transform-origin:left; transition:transform 1.8s var(--ease-out); }
  .anim .reveal:not(.in) .linea-30 .pista i, .anim .linea-30.reveal:not(.in) .pista i{ transform:scaleX(0); }
  table.data td.area{ white-space:nowrap; }
  .foto-grid{ display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:10px; margin-top:22px; }
  .foto-it{ border:1px solid var(--line); border-radius:14px; padding:16px; background:var(--surface); }
  .foto-it b{ display:block; font-family:var(--font-display); font-size:14px; margin-bottom:6px; } .foto-it span{ font-size:13px; color:var(--text-dim); line-height:1.55; }
  .vitalicio{ display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; margin-top:22px; }
  .vit{ border:1px solid var(--owner-color-dim); border-radius:16px; padding:20px; background:linear-gradient(160deg, rgba(217,30,38,.12), var(--surface) 60%); }
  .vit .ic{ width:34px; height:34px; border-radius:10px; background:var(--owner-color-soft); display:grid; place-items:center; margin-bottom:12px; }
  .vit .ic svg{ width:18px; height:18px; fill:none; stroke:var(--amore-light); stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; }
  .vit b{ display:block; font-family:var(--font-display); font-size:15px; margin-bottom:6px; } .vit span{ font-size:13.5px; color:var(--text-dim); line-height:1.6; }
  .flow{ display:flex; flex-direction:column; margin-top:24px; max-width:780px; }
  .flow-step{ display:flex; gap:18px; padding:16px 0; border-top:1px solid var(--line); }
  .flow-step:last-child{ border-bottom:1px solid var(--line); }
  .flow-step .n{ font-family:var(--font-display); font-weight:800; font-size:12px; flex:none; width:28px; margin-top:2px; }
  .flow-step b{ display:block; color:var(--text); font-size:14.5px; margin-bottom:3px; } .flow-step span{ font-size:13.5px; color:var(--text-dim); line-height:1.6; }

  /* agenda */
  .agenda{ display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:22px; margin-top:24px; }
  .ag-grupo{ display:flex; flex-wrap:wrap; gap:8px; margin-bottom:16px; }
  .ag-op{ background:var(--surface); color:var(--text-dim); border:1px solid var(--line); border-radius:12px; padding:10px 14px; font:inherit; font-size:13px; font-weight:700; cursor:pointer; text-align:left; }
  .ag-op b{ display:block; text-transform:capitalize; color:inherit; } .ag-op span{ font-size:12px; }
  .ag-op.on{ background:var(--owner-color-soft); color:var(--text); border-color:var(--owner-color-dim); }
  .ag-lbl{ font-size:11.5px; font-weight:800; letter-spacing:.06em; text-transform:uppercase; color:var(--text-dim); margin-bottom:8px; display:block; }
  .ag-msg{ background:var(--bg); border:1px solid var(--line); border-radius:14px; padding:16px; font-size:14.5px; line-height:1.65; margin-bottom:12px; }
  .reunion-lista{ display:grid; gap:10px; margin-top:14px; }
  .reunion-lista div{ display:flex; gap:12px; font-size:14px; color:var(--text-dim); line-height:1.55; } .reunion-lista b{ color:var(--text); }

  footer .logos{ display:flex; align-items:center; justify-content:center; gap:16px; margin-bottom:16px; }
  footer .logos .x{ font-family:var(--font-display); font-weight:700; color:var(--text-dim); }
  footer .logos img.cliente-mini{ width:72px; height:72px; border-radius:50%; }

  @media (hover:hover) and (pointer:fine){
    .mod:hover, .semana:hover, .foto-it:hover, .vit:hover{ border-color:var(--owner-color-dim); }
    .semana, .foto-it, .vit{ transition:transform .35s var(--ease-out), border-color .3s var(--ease-out); }
    .semana:hover, .foto-it:hover, .vit:hover{ transform:translateY(-4px); }
  }
  @media (max-width:980px){
    .mods{ grid-template-columns:repeat(2,minmax(0,1fr)); }
    .demo, .demo-menu, .prop, .agenda, .rec{ grid-template-columns:minmax(0,1fr); }
    .semanas{ grid-template-columns:repeat(2,minmax(0,1fr)); }
    .foto-grid{ grid-template-columns:repeat(2,minmax(0,1fr)); }
    .vitalicio{ grid-template-columns:minmax(0,1fr); }
  }
  @media (max-width:640px){
    section.chapter{ padding:54px 0 58px; }
    .mods, .semanas, .foto-grid{ grid-template-columns:minmax(0,1fr); }
    .rec-pasos{ flex-direction:row; overflow-x:auto; scrollbar-width:none; margin-inline:-18px; padding:0 18px 4px; }
    .rec-pasos::-webkit-scrollbar{ display:none; }
    .rec-pasos button{ flex:none; border-color:var(--line); }
    .rec-panel{ padding:20px; min-height:0; }
    .pe-fila{ grid-template-columns:minmax(0,1fr) 76px; }
    .pe-barra{ grid-column:1 / -1; } .pe-v{ grid-column:1 / -1; text-align:left; }
    .form-sitio{ grid-template-columns:minmax(0,1fr); }
    .giants-strip{ display:flex; overflow-x:auto; scroll-snap-type:x mandatory; gap:14px; margin-inline:-18px; padding:4px 18px 10px; scrollbar-width:none; }
    .giants-strip::-webkit-scrollbar{ display:none; }
    .giant-block{ flex:0 0 76%; scroll-snap-align:center; border:1px solid var(--line); border-radius:18px; padding:20px 14px 22px; background:var(--surface); }
    .giant-block .fig, .giant-block .fig img{ height:200px; }
    .swipe-hint{ display:flex; justify-content:center; margin-top:14px; font-size:12px; font-weight:600; color:var(--text-dim); }
    .tarjeta{ padding:20px; }
    table.data{ font-size:13px; }
    table.stack thead{ display:none; }
    table.stack, table.stack tbody, table.stack tr, table.stack td{ display:block; width:100%; }
    table.stack tr{ padding:14px 4px; border-bottom:1px solid var(--line); }
    table.stack td{ border-bottom:none; padding:3px 12px; }
    table.stack td[data-label]::before{ content:attr(data-label); display:block; font-size:10.5px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; color:var(--text-dim); margin-top:6px; }
  }
  @media (prefers-reduced-motion: reduce){
    .anim .reveal:not(.in), .anim .giant-block:not(.in) .fig img{ opacity:1; transform:none; }
    .anim *, .anim *::before, .anim *::after{ animation:none !important; transition:none !important; }
    .vapor path{ stroke-dashoffset:0 !important; }
  }
`;

const fr = t => `      <div class="field-row reveal"><span class="fnum">${HOJA}</span><div>${t}</div></div>`;
const step = (n, b, t) => `      <div class="flow-step reveal"><span class="n">${n}</span><div><b>${b}</b><span>${t}</span></div></div>`;

// ---------- Marca de Magnus: símbolo (barra superior, pie) y logo completo (portada) ----------
const fotoFullB64 = 'data:image/jpeg;base64,' + fs.readFileSync(ROOT + 'clientes/magnus-company/marca/logo-magnus-original.jpg').toString('base64');
const fotoFull = (cls) => `<img class="${cls}" src="${fotoFullB64}" alt="Magnus Company Colombia">`;

const css2 = css + `
  /* ===== Magnus: grupos, marco de portada y demos ===== */
  .portada-foto .marco{ border-radius:28px; aspect-ratio:1/1; background:#fff; padding:6px; }
  .portada-foto .marco img{ object-fit:contain; }
  .topnav .client img{ background:#fff; }
  .g-ven{ --c:var(--amore-light); } .g-bod{ --c:var(--orange); } .g-rep{ --c:var(--lime); }
  .g-eq{ --c:#6E98FF; } .g-dir{ --c:#B58CE0; } .g-web{ --c:#9AA0A6; }
  .areas{ display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; margin-top:26px; }
  @media (max-width:900px){ .areas{ grid-template-columns:repeat(2,minmax(0,1fr)); } }
  @media (max-width:560px){ .areas{ grid-template-columns:1fr; } }
  .area-card{ border:1px solid var(--line); border-radius:16px; background:var(--surface); padding:18px; border-top:3px solid var(--c); }
  .area-card h3{ font-family:var(--font-display); font-size:15px; margin:0 0 4px; }
  .area-card .quien{ font-size:12px; color:var(--text-dim); margin:0 0 12px; }
  .area-card ul{ margin:0; padding:0; list-style:none; display:grid; gap:6px; font-size:13.5px; color:var(--text-dim); }
  .area-card li{ display:flex; gap:9px; line-height:1.45; } .area-card li::before{ content:""; width:6px; height:6px; border-radius:50%; background:var(--c); margin-top:7px; flex:none; }
  .cambia{ display:grid; gap:10px; margin-top:24px; }
  .cambia > div{ display:grid; grid-template-columns:minmax(0,1fr) 28px minmax(0,1fr); gap:12px; align-items:center; border:1px solid var(--line); border-radius:14px; background:var(--surface); padding:14px 16px; font-size:14px; }
  .cambia .hoy{ color:var(--text-dim); } .cambia .flecha{ color:var(--amore-light); text-align:center; font-weight:800; } .cambia .con{ color:var(--text); }
  .cambia small{ display:block; font-size:10.5px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; margin-bottom:2px; color:var(--text-dim); } .cambia .con small{ color:var(--amore-light); }
  @media (max-width:640px){ .cambia > div{ grid-template-columns:1fr; } .cambia .flecha{ display:none; } }
  .dm{ display:grid; grid-template-columns:minmax(0,1.3fr) minmax(0,1fr); gap:18px; margin-top:22px; align-items:start; }
  @media (max-width:900px){ .dm{ grid-template-columns:1fr; } }
  .dm-panel{ border:1px solid var(--line); border-radius:16px; background:var(--surface); padding:16px; min-width:0; }
  .dm-panel h5{ font-family:var(--font-display); font-size:14px; margin:0 0 4px; } .dm-panel > p{ font-size:12.5px; color:var(--text-dim); margin:0 0 12px; }
  .dm input, .dm select{ font:inherit; font-size:13.5px; color:var(--text); background:var(--bg); border:1px solid var(--line); border-radius:10px; padding:9px 10px; min-width:0; max-width:100%; }
  .dm button{ font:inherit; cursor:pointer; }
  .dm .chips{ display:flex; flex-wrap:wrap; gap:6px; margin:10px 0; }
  .dm .chips button{ background:var(--bg); color:var(--text-dim); border:1px solid var(--line); border-radius:999px; padding:6px 12px; font-size:12.5px; font-weight:700; }
  .dm .chips button.on{ background:var(--owner-color-soft); color:var(--text); border-color:var(--owner-color-dim); }
  .ped-lista{ display:grid; gap:8px; max-height:420px; overflow:auto; padding-right:2px; }
  .ped-prod{ display:grid; grid-template-columns:minmax(0,1fr) auto; gap:8px 10px; border:1px solid var(--line); border-radius:12px; padding:10px 12px; background:var(--bg); align-items:center; }
  .ped-info b{ display:block; font-size:14px; color:var(--text); } .ped-info span{ font-size:12px; color:var(--text-dim); }
  .ped-prod select{ grid-column:1 / -1; width:100%; }
  .ped-stock{ font-size:12px; font-weight:700; } .ped-stock.verde{ color:var(--lime); } .ped-stock.amar{ color:#F2C94C; } .ped-stock.rojo{ color:#FF6B6B; }
  .ped-qty{ display:flex; align-items:center; gap:6px; justify-self:end; } .ped-qty b{ min-width:24px; text-align:center; }
  .ped-qty button{ width:30px; height:30px; border-radius:50%; border:1px solid var(--line); background:var(--surface); color:var(--text); font-size:16px; line-height:1; }
  .ped-add{ grid-column:1 / -1; background:var(--text); color:var(--bg); border:0; border-radius:10px; padding:9px; font-weight:800; font-size:13px; }
  .ped-add:disabled{ opacity:.35; cursor:not-allowed; }
  .ped-linea{ display:flex; justify-content:space-between; gap:10px; padding:9px 0; border-bottom:1px solid var(--line); font-size:13.5px; } .ped-linea b{ display:block; color:var(--text); } .ped-linea span{ font-size:12px; color:var(--text-dim); }
  .ped-lt{ display:flex; align-items:center; gap:8px; white-space:nowrap; font-weight:700; color:var(--text); } .ped-lt button{ background:none; border:0; color:var(--text-dim); font-size:18px; }
  .ped-total{ margin-top:12px; display:grid; gap:6px; font-size:13.5px; } .ped-total > div{ display:flex; justify-content:space-between; gap:10px; color:var(--text-dim); } .ped-total b{ color:var(--text); }
  .ped-total .gran{ border-top:1px solid var(--line); padding-top:8px; font-size:16px; color:var(--text); } .ped-total .gran b{ font-family:var(--font-display); }
  .ped-pista{ font-size:12px; color:var(--text-dim); margin:4px 0 0; }
  .ped-vacio{ font-size:13px; color:var(--text-dim); margin:8px 0; }
  .dm .enviar, .gps-wrap .enviar{ font:inherit; cursor:pointer; width:100%; margin-top:12px; background:var(--amore); color:#fff; border:0; border-radius:12px; padding:12px; font-weight:800; font-size:14px; } .dm .enviar:disabled, .gps-wrap .enviar:disabled{ opacity:.4; cursor:not-allowed; }
  .dm .aviso, .dm .ok{ margin-top:10px; border-radius:12px; padding:11px 13px; font-size:13px; display:grid; gap:2px; } .dm .aviso{ background:rgba(255,107,107,.12); border:1px solid rgba(255,107,107,.4); color:var(--text); }
  .dm .ok{ background:rgba(179,205,36,.12); border:1px solid rgba(179,205,36,.4); } .dm .ok b{ color:var(--text); } .dm .ok span{ color:var(--text-dim); }
  .lote{ display:flex; justify-content:space-between; gap:10px; align-items:center; border:1px solid var(--line); border-left-width:4px; border-radius:12px; padding:10px 12px; background:var(--bg); margin-bottom:8px; }
  .lote b{ display:block; font-size:14px; color:var(--text); } .lote span{ font-size:12px; color:var(--text-dim); } .lote-q{ font-weight:800; color:var(--text); white-space:nowrap; } .lote-q em{ font-style:normal; color:#FF9F6B; margin-left:4px; }
  .lote.rojo{ border-left-color:#FF6B6B; } .lote.amar{ border-left-color:#F2C94C; } .lote.verde{ border-left-color:var(--lime); }
  .lotes-total{ font-size:12.5px; color:var(--text-dim); margin:4px 0 12px; }
  .lotes-form{ display:flex; flex-wrap:wrap; gap:8px; align-items:end; } .lotes-form label{ display:grid; gap:4px; font-size:12px; font-weight:700; color:var(--text-dim); flex:1 1 130px; } .lotes-form .enviar{ width:auto; margin:0; flex:1 1 130px; }
  .gps-wrap{ display:grid; grid-template-columns:minmax(0,1.2fr) minmax(0,1fr); gap:16px; margin-top:22px; align-items:start; } @media (max-width:900px){ .gps-wrap{ grid-template-columns:1fr; } }
  #gps-svg{ width:100%; height:auto; display:block; background:#1d1a21; border:1px solid var(--line); border-radius:14px; }
  .g-grid line{ stroke:rgba(244,241,236,.07); stroke-width:1; } .g-ruta{ fill:none; stroke:rgba(244,241,236,.25); stroke-width:3; stroke-dasharray:6 5; stroke-linecap:round; stroke-linejoin:round; }
  .g-bodega rect{ fill:var(--amore); } .g-lbl{ fill:var(--text-dim); font-size:9px; font-family:var(--font-body,inherit); }
  .g-punto{ fill:var(--orange); stroke:#fff; stroke-width:2; } .g-punto.sel{ fill:var(--amore-light); r:9; } .g-punto.hecho{ fill:var(--lime); }
  .ent{ display:flex; justify-content:space-between; gap:10px; border:1px solid var(--line); border-radius:12px; padding:11px 13px; background:var(--bg); margin-bottom:8px; cursor:pointer; } .ent.on{ border-color:var(--owner-color-dim); background:var(--owner-color-soft); }
  .ent b{ display:block; color:var(--text); font-size:14px; } .ent span{ font-size:12px; color:var(--text-dim); } .ent-der{ text-align:right; display:grid; gap:3px; justify-items:end; } .ent small{ font-size:11.5px; color:var(--text-dim); }
  .est{ border-radius:999px; padding:2px 9px; font-size:11px !important; font-weight:800; } .est.verde{ background:rgba(179,205,36,.18); color:var(--lime) !important; } .est.amar{ background:rgba(242,201,76,.16); color:#F2C94C !important; } .est.gris{ background:rgba(244,241,236,.1); }
  #gps-det{ font-size:12.5px; color:var(--text-dim); margin:8px 0 6px; }
  .nota-honesta{ font-size:12.5px; color:var(--text-dim); border-left:3px solid var(--owner-color-dim); padding:4px 0 4px 12px; margin:14px 0 0; max-width:780px; }
  .check{ display:grid; gap:10px; margin-top:22px; max-width:820px; }
  .check > div{ display:flex; gap:12px; font-size:14px; color:var(--text-dim); line-height:1.55; } .check b{ color:var(--text); }

  /* ===== Ajuste de diseño: más sobrio ===== */
  .vapor, .portada-foto .halo{ display:none; }
  .boton{ border-radius:4px; text-transform:uppercase; letter-spacing:.07em; font-size:12px; font-weight:800; padding:14px 24px; }
  .boton.lleno{ background:var(--amore); color:#fff; border-color:var(--amore); }
  .boton:not(.lleno){ background:transparent; color:var(--text); border-color:var(--line-strong, rgba(244,241,236,.35)); }
  @media (hover:hover) and (pointer:fine){ .boton:hover{ transform:none; filter:brightness(1.12); } }
  .doc-eyebrow, .badge, .cobrand .pill{ border-radius:4px; }
  .portada-foto .marco{ border-radius:10px; box-shadow:0 24px 50px rgba(0,0,0,.5); padding:0; }
  .tarjeta, .area-card, .mod, .dm-panel, .cambia > div, #gps-svg{ border-radius:10px; }
  .area-card{ border-top-width:2px; }
  .filtros-mod button, .dm .chips button{ border-radius:4px; text-transform:uppercase; letter-spacing:.05em; font-size:11.5px; }
  .ped-prod, .lote, .ent, .dm .aviso, .dm .ok{ border-radius:8px; }
  .ped-add, .dm .enviar, .gps-wrap .enviar{ border-radius:4px; text-transform:uppercase; letter-spacing:.06em; font-size:12px; }
  .ped-qty button{ border-radius:4px; }
  .est{ border-radius:4px; }
  .dm input, .dm select{ border-radius:6px; }
`;

let cap = 0;
const num = () => { cap += 1; return String(cap).padStart(2, '0'); };
const head2 = (titulo, hi) => `    <div class="chapter-head reveal"><span class="chapter-num">${num()} /</span></div>\n    <h2 class="chapter-title reveal">${titulo}${hi ? ' <span class="hi">' + hi + '</span>' : ''}</h2>`;
const m = (g, grupoTxt, titulo, resumen, puntos) => `      <details class="mod g-${g}" data-grupo="${g}"><summary><span class="grupo"><i></i>${grupoTxt}</span><b>${titulo}</b><span class="res">${resumen}</span><span class="mas">Ver cómo funciona +</span></summary><ul>${puntos.map(p => '<li>' + p + '</li>').join('')}</ul></details>`;
const area2 = (g, titulo, quien, items) => `      <div class="area-card g-${g} reveal"><h3>${titulo}</h3><p class="quien">${quien}</p><ul>${items.map(i => '<li>' + i + '</li>').join('')}</ul></div>`;
const cambia = (hoy, con) => `      <div class="reveal"><div class="hoy"><small>Hoy</small>${hoy}</div><div class="flecha">→</div><div class="con"><small>Con el sistema</small>${con}</div></div>`;
const chk = (t) => `      <div class="reveal"><span class="fnum">${HOJA}</span><div>${t}</div></div>`;

const body = `
<div class="topnav">
  <div class="wrap">
    <div class="brand">${sysmo('')}<span class="doc-name">Propuesta · Magnus Company</span></div>
    <div class="client">${foto('')}<span>Magnus Company</span></div>
  </div>
</div>
<style>
  :root{
    --amore:#D91E26; --amore-light:#FF5A5F; --amore-deep:#A3141A;
    --owner-color:#FF5A5F; --owner-color-soft:rgba(217,30,38,.16); --owner-color-dim:rgba(255,90,95,.5);
  }
</style>

<section class="hero-doc">
  <div class="wrap">
    <div class="hero-copy">
      <div class="doc-eyebrow"><i></i>Propuesta personalizada · Integral 360</div>
      <h1 class="doc-title"><span class='accent'>Magnus Company</span></h1>
      <p class="doc-lede">Un solo sistema para vender más sin perder pedidos, saber qué hay en bodega y en qué lote, llevar los pedidos con sus conductores, cuidar al equipo y tomar decisiones con datos claros. Más de 800 productos, todos a la mano y organizados.</p>
      <div class="hero-cta"><a class="boton lleno" href="#modulos">Ver lo que incluye</a><a class="boton" href="#demos">Probar las demos</a></div>
      <div class="cobrand">${sysmo('sysmo-mark')}<span>×</span><span class="pill"><i></i>Magnus Company Colombia</span></div>
    </div>
    <div class="portada-foto"><div class="halo"></div><div class="marco">${fotoFull('')}</div></div>
  </div>
  <svg class="vapor" viewBox="0 0 1440 64" preserveAspectRatio="none" aria-hidden="true"><path d="M0 40 C 240 10, 480 60, 720 34 S 1200 12, 1440 38"/></svg>
</section>

<section class="chapter">
  <div class="wrap">
${head2('Datos del proyecto')}
    <div class="field-list">
${fr('<b>Cliente:</b> Magnus Company Colombia · proveedor mayorista con más de 800 productos')}
${fr('<b>Proyecto:</b> Sistema integral de ventas, bodega, reparto y equipo, con página web y chatbot')}
${fr('<b>Nivel de servicio:</b> Integral 360 (Estratega, Productor y Desarrollador)')}
${fr('<b>Entrega:</b> por fases. Cada fase se entrega funcionando y se aprueba antes de pasar a la siguiente. El calendario se define después del diagnóstico')}
    </div>
  </div>
</section>

<section class="chapter">
  <div class="wrap">
${head2('Objetivo')}
    <p class="lede reveal">Que el dueño tenga el negocio en la mano: que ninguna venta se pierda por falta de información, que la bodega y el reparto estén ordenados y que cada decisión se tome con datos y no con intuición.</p>
    <div class="field-list">
${fr('<b>No perder ventas.</b> Pedidos tomados en pocos toques, stock real a la vista y avisos antes de quedarse sin producto.')}
${fr('<b>Todo a la mano.</b> Catálogo, clientes, inventario, entregas y equipo en un solo lugar, desde el celular, la tablet o el computador.')}
${fr('<b>Datos claros para decidir.</b> Qué se vende, qué no se mueve, qué se vence, quién compra y quién dejó de comprar.')}
${fr('<b>Facturar sin papeleo.</b> Cotización, remisión y factura desde el mismo pedido, con la cartera de cada cliente.')}
${fr('<b>Equipo bajo control.</b> Turnos, asistencia, conductores y nómina conectados, sin hojas de cálculo.')}
${fr('<b>Llegar a más clientes.</b> Una página web con catálogo y recetarios, y un chatbot que atiende y toma pedidos.')}
    </div>
  </div>
</section>

<section class="chapter">
  <div class="wrap">
${head2('Cómo cambia', 'el día a día')}
    <p class="lede reveal">Lo que hoy se hace a mano, con llamadas, papeles o libretas, pasa a hacerse solo y quedar registrado.</p>
    <div class="cambia">
${cambia('El vendedor llama a bodega para saber si hay producto.', 'Ve el stock real, por presentación, antes de prometerlo al cliente.')}
${cambia('Se revisa la bodega para saber qué está por vencerse.', 'El sistema avisa qué lote vence primero y lo despacha primero.')}
${cambia('Se pregunta al conductor dónde va y si ya entregó.', 'El dueño ve a cada conductor en el mapa y la entrega con foto y firma.')}
${cambia('Las horas del equipo se anotan y se suman al final del mes.', 'La asistencia queda registrada con foto y la nómina se arma sola.')}
${cambia('No se sabe qué clientes dejaron de comprar.', 'El sistema avisa quién llevaba tiempo sin pedir y qué solía llevar.')}
${cambia('Los precios y descuentos viven en la cabeza o en un Excel.', 'Cada cliente tiene su lista de precios y su descuento por volumen, definidos por la administración.')}
    </div>
  </div>
</section>

<section class="chapter">
  <div class="wrap">
${head2('Quién trabaja en', 'su proyecto')}
    <p class="lede reveal">Integral 360 activa las tres áreas de SYSMOOO como una extensión del equipo de Magnus Company, coordinadas desde el primer día.</p>
    <div class="giants-strip">
      <div class="giant-block est reveal"><div class="fig">${imgEst.trim()}</div><div class="label"><span class="dot"></span><span class="num">01</span><span class="name-tag">estratega.</span></div><div class="role">Diagnostica cómo se vende, se almacena y se reparte hoy, define los flujos y las prioridades, y supervisa todo el proyecto.</div></div>
      <div class="giant-block pro reveal" style="transition-delay:.1s;"><div class="fig">${imgPro.trim()}</div><div class="label"><span class="dot"></span><span class="num">02</span><span class="name-tag">productor.</span></div><div class="role">Fotografía de los productos, la bodega y el equipo, para el catálogo del sistema, la página web y el chatbot.</div></div>
      <div class="giant-block dev reveal" style="transition-delay:.2s;"><div class="fig">${imgDev.trim()}</div><div class="label"><span class="dot"></span><span class="num">03</span><span class="name-tag">desarrollador.</span></div><div class="role">Sistema general, ventas, bodega, reparto, equipo, página web, chatbot y capacitación.</div></div>
    </div>
    <div class="swipe-hint">Desliza para conocer a los tres →</div>
  </div>
</section>

<section class="chapter" id="mapa">
  <div class="wrap">
${head2('El sistema, organizado en', 'seis áreas')}
    <p class="lede reveal">Todo lo que Magnus Company pidió queda agrupado por área de trabajo. Cada área tiene su pantalla y cada persona entra solo a lo que le corresponde.</p>
    <div class="areas">
${area2('ven', 'Ventas', 'Para vendedores, mostrador y clientes', ['Pantalla de vendedores', 'Pantalla de pedido en tienda', 'Base de clientes', 'Facturación y cobros'])}
${area2('bod', 'Bodega y catálogo', 'Para bodega y compras', ['Inventario por lotes, fechas y cantidad', 'Catálogo de más de 800 productos', 'Fotos de producto'])}
${area2('rep', 'Reparto', 'Para despachos y conductores', ['Domicilios', 'Sistema para conductores', 'GPS de conductores'])}
${area2('eq', 'Equipo', 'Para empleados y administración', ['Sistema para empleados', 'Control de asistencia', 'Turnos', 'Nómina'])}
${area2('dir', 'Dirección', 'Para el dueño', ['Sistema general (el panel del dueño)', 'Reportes para tomar decisiones'])}
${area2('web', 'Web y atención', 'Para clientes y proveedores', ['Sitio web con recetarios', 'Chatbot en WhatsApp y web'])}
    </div>
  </div>
</section>

<section class="chapter" id="modulos">
  <div class="wrap">
${head2('Todo lo que', 'incluye el sistema')}
    <p class="lede reveal">Un solo sistema conectado, en la nube, que se usa desde celular, tablet o computador. Filtre por área y abra cada módulo para ver cómo funciona.</p>
    <div class="filtros-mod reveal">
      <button type="button" class="on" data-filtro="todos" aria-pressed="true">Todo</button>
      <button type="button" data-filtro="ven" aria-pressed="false">Ventas</button>
      <button type="button" data-filtro="bod" aria-pressed="false">Bodega y catálogo</button>
      <button type="button" data-filtro="rep" aria-pressed="false">Reparto</button>
      <button type="button" data-filtro="eq" aria-pressed="false">Equipo</button>
      <button type="button" data-filtro="dir" aria-pressed="false">Dirección</button>
      <button type="button" data-filtro="web" aria-pressed="false">Web y atención</button>
    </div>
    <div class="mods">
${m('ven', 'Ventas', 'Pantalla de vendedores', 'Cada vendedor ve el catálogo, el stock real y los precios de sus clientes desde el celular o la tablet.', ['Búsqueda por nombre, código o categoría entre todos los productos.', 'Stock por presentación en tiempo real (unidad, caja, paca, bulto).', 'Precios por cliente y descuento por volumen, definidos por la administración.', 'Pedido en pocos toques, con el historial del cliente y la opción de repetir el último pedido.', 'El pedido llega a bodega sin papel ni llamadas.', 'Ventas del día y comisiones de cada vendedor, calculadas solas.'])}
${m('ven', 'Ventas', 'Pantalla de pedido en tienda', 'Para quien llega al punto de venta: pide en una pantalla y el pedido va directo a alistamiento y caja.', ['Pantalla táctil con fotos, categorías y búsqueda.', 'El cliente elige presentación y cantidad, y el sistema le muestra la disponibilidad.', 'El pedido llega a caja y a bodega con su número de turno.', 'El vendedor puede completarlo o corregirlo antes de cobrar.', 'Menos filas y menos errores de digitación.'])}
${m('ven', 'Ventas', 'Base de clientes', 'Cada cliente con su historial, sus condiciones y lo que suele comprar.', ['Ficha con datos, NIT, direcciones de entrega y contactos.', 'Historial de compras, productos frecuentes y saldo pendiente.', 'Lista de precios y condiciones propias de cada cliente.', 'Aviso de clientes que llevan tiempo sin pedir, para llamarlos a tiempo.', 'Clientes nuevos que llegan por el chatbot o la web quedan registrados solos.'])}
${m('ven', 'Ventas', 'Facturación y cobros', 'Cotización, remisión y factura desde el mismo pedido, con la cartera de cada cliente.', ['Cotización que se convierte en pedido con un toque.', 'Remisión y factura de venta con el detalle de presentaciones y lotes.', 'Medios de pago, abonos y cartera por cliente con fechas de vencimiento.', '<b>Factura electrónica ante la DIAN</b> mediante un proveedor tecnológico autorizado, que se define en el diagnóstico. El costo del proveedor es aparte.', 'Reportes listos para entregar al contador.'])}
${m('bod', 'Bodega y catálogo', 'Inventario por lotes, fechas y cantidad', 'Qué hay, en qué lote y cuándo vence. Sale primero lo que vence primero.', ['Cada entrada se registra con su lote y su fecha de vencimiento.', 'Stock por presentación y por bodega, con mínimo de alerta.', 'Despacho por vencimiento: primero vence, primero sale.', 'Alertas de productos por vencer, agotados o por debajo del mínimo.', 'Ajustes y mermas con su motivo, y conteos físicos desde el celular.', 'Trazabilidad: de qué lote salió cada venta. <b>Pruébelo en la demo.</b>'])}
${m('bod', 'Bodega y catálogo', 'Catálogo de más de 800 productos', 'La fuente única de productos para vendedores, tienda, página web y chatbot.', ['Carga masiva desde Excel y edición desde el panel.', 'Categorías, marcas y códigos de barras.', 'Cada producto con sus presentaciones y tamaños (unidad, caja, paca, bulto).', 'Precios por presentación y por lista (por ejemplo, mayorista o distribuidor).', 'Productos activos o inactivos, sin borrar el historial.'])}
${m('bod', 'Bodega y catálogo', 'Fotos de producto', 'Sesión fotográfica profesional para que el catálogo se vea como el negocio merece.', ['Fotografía de los productos, de la bodega y del equipo, a cargo del Productor.', 'Fotos en varios tamaños para que el catálogo cargue rápido en el celular.', 'Las fotos aparecen en la pantalla de vendedores, la tienda, la web y el chatbot.', 'La cantidad de productos fotografiados y el orden se definen en el diagnóstico.'])}
${m('rep', 'Reparto', 'Domicilios', 'Cada pedido con entrega tiene su dirección, su ventana de entrega y su responsable.', ['Pedido con dirección, contacto y horario de entrega.', 'Asignación al conductor y orden de la ruta del día.', 'Estados claros: por alistar, cargado, en ruta, entregado o novedad.', 'El cliente recibe un enlace para ver en qué va su pedido.', 'Cobro contra entrega registrado y cuadrado con la factura.'])}
${m('rep', 'Reparto', 'Sistema para conductores', 'Una app que se instala en el celular del conductor con todo lo que necesita para entregar.', ['Ve sus entregas del día en orden y abre la dirección en el mapa.', 'Marca cargado, en ruta o entregado con un toque.', 'Evidencia de entrega: foto y nombre de quien recibe.', 'Registra novedades (no estaba, rechazó, faltó producto) con su motivo.', 'Registra el cobro contra entrega y su asistencia al turno.'])}
${m('rep', 'Reparto', 'GPS de conductores', 'El dueño ve dónde va cada conductor, sin comprar aparatos.', ['Ubicación en vivo en el mapa de la administración, desde el celular del conductor.', 'Solo durante el turno y con aviso al conductor, cuidando su privacidad.', 'Historial de recorridos y tiempos entre entregas.', 'Hora estimada de llegada para avisar al cliente.', 'La ubicación se actualiza mientras la app esté abierta en el celular. <b>Pruébelo en la demo</b> (simulado).'])}
${m('eq', 'Equipo', 'Sistema para empleados', 'Cada persona entra con su usuario y ve solo lo que le corresponde.', ['Roles: vendedor, bodega, conductor, caja y administración.', 'Cada empleado ve sus turnos, sus horas y sus comprobantes de pago.', 'Solicitudes de permisos y cambios de turno, con aprobación.', 'Comunicados internos en un solo lugar.'])}
${m('eq', 'Equipo', 'Control de asistencia', 'Entrada y salida con foto desde el celular o la tablet del local.', ['Registro con foto para evitar suplantaciones.', 'Retardos, ausencias y horas extra calculados solos.', 'Recargos nocturnos, dominicales y festivos aplicados según la ley.', 'Las horas alimentan la nómina sin digitar nada.'])}
${m('eq', 'Equipo', 'Turnos', 'Quién trabaja cuándo, sin cruces y sin llamadas.', ['Calendario de turnos por área: bodega, ventas, reparto y caja.', 'Cambios de turno que el empleado pide y la administración aprueba.', 'Aviso cuando un turno queda sin cubrir.', 'Cada empleado ve su turno en el celular.'])}
${m('eq', 'Equipo', 'Nómina', 'La liquidación se arma desde la asistencia y los turnos.', ['Liquidación con horas, recargos, auxilios y deducciones.', 'Comprobante de pago por persona.', 'Historial que no se puede alterar una vez pagado.', 'Reportes exportables para el contador y para la nómina electrónica a través de un proveedor autorizado.'])}
${m('dir', 'Dirección', 'Sistema general', 'El panel del dueño: cómo va el día, de un vistazo.', ['Ventas, pedidos, entregas y stock crítico del día en una sola pantalla.', 'Cartera por cobrar y facturas por vencer.', 'Usuarios, permisos y configuración del sistema.', 'Todo en la nube, con respaldo de la información y acceso desde cualquier lugar.', 'Historial de quién hizo qué.'])}
${m('dir', 'Dirección', 'Reportes para tomar decisiones', 'Datos claros sobre lo que se vende, lo que no se mueve y lo que hay que comprar.', ['Ventas por producto, cliente, vendedor y ruta.', 'Margen por producto y por cliente.', 'Productos de mayor y menor rotación, y los que se están quedando quietos.', 'Qué reponer y cuándo, según lo que se vende.', 'Clientes que dejaron de comprar y clientes que más compran.', 'Comparación entre semanas y meses, y exportables para el contador.'])}
${m('web', 'Web y atención', 'Sitio web con recetarios', 'La casa digital de Magnus Company: catálogo, recetas y contacto.', ['Catálogo con fotos, categorías y presentaciones, y botón para pedir cotización.', '<b>Recetarios:</b> recetas hechas con productos de Magnus, con los ingredientes enlazados al catálogo.', 'Botón «pedir estos ingredientes» que lleva la receta al pedido o a la cotización.', 'Contenido que la empresa edita desde el panel, sin depender de nadie.', 'Preparada para aparecer en Google: títulos, descripciones y datos estructurados.'])}
${m('web', 'Web y atención', 'Chatbot', 'Un asistente que atiende a los clientes en WhatsApp y en la web, todos los días.', ['Responde preguntas frecuentes: horarios, cobertura, formas de pago y productos.', 'Consulta el catálogo y la disponibilidad real, sin inventar precios.', 'Toma pedidos y solicitudes de cotización, y se los entrega al vendedor.', 'Informa el estado de un pedido o de una entrega.', 'Pasa la conversación a una persona cuando lo necesita.', 'Funciona con WhatsApp Business: requiere un número verificado y el consumo lo cobra Meta directamente.'])}
    </div>
  </div>
</section>

<section class="chapter" id="demos">
  <div class="wrap">
${head2('Pruébelo', 'ahora mismo')}
    <p class="lede reveal">Tres demostraciones para tocar: tomar un pedido mayorista, despachar por lote y seguir a los conductores. Los productos, las fechas y los conductores son de ejemplo.</p>

    <h3 class="chapter-title reveal" style="font-size:clamp(18px,2.3vw,22px);margin-top:34px">Pedido mayorista: presentaciones, stock y descuento por volumen</h3>
    <div class="dm reveal" id="demo-pedido">
      <div class="dm-panel">
        <h5>Catálogo</h5><p>Busque un producto, elija la presentación y agréguelo. Pruebe pedir más de lo que hay.</p>
        <input id="ped-buscar" type="search" placeholder="Buscar producto…" aria-label="Buscar producto" style="width:100%">
        <div class="chips" id="ped-cats"></div>
        <div class="ped-lista" id="ped-lista"></div>
      </div>
      <div class="dm-panel">
        <h5>Pedido del cliente</h5><p>Restaurante La Esquina · lista mayorista</p>
        <div id="ped-carrito"></div>
        <div class="ped-total" id="ped-total"></div>
        <div class="aviso" id="ped-aviso" hidden></div>
        <button type="button" class="enviar" id="ped-enviar" disabled>Enviar pedido a bodega</button>
        <div class="ok" id="ped-ok" hidden></div>
      </div>
    </div>
    <p class="demo-nota reveal">Productos, precios y tramos de descuento de ejemplo. Los reales salen de su catálogo.</p>

    <h3 class="chapter-title reveal" style="font-size:clamp(18px,2.3vw,22px);margin-top:40px">Inventario por lotes: primero vence, primero sale</h3>
    <div class="dm reveal" id="demo-lotes">
      <div class="dm-panel">
        <h5>Aceite de girasol · Caja x 12</h5><p>Cuatro lotes en bodega, con su fecha de vencimiento.</p>
        <div id="lotes-lista"></div>
        <p class="lotes-total" id="lotes-total"></p>
      </div>
      <div class="dm-panel">
        <h5>Despachar un pedido</h5><p>Escriba cuántas unidades pide el cliente. El sistema decide de qué lote salen.</p>
        <form class="lotes-form" id="lotes-form"><label>Unidades<input id="lotes-q" type="number" min="1" max="500" value="60" inputmode="numeric"></label><button class="enviar" type="submit">Despachar</button></form>
        <div class="ok" id="lotes-msg" hidden></div>
      </div>
    </div>
    <p class="demo-nota reveal">Un lote vencido queda bloqueado para la venta. Las fechas de la demo se calculan a partir de hoy.</p>

    <h3 class="chapter-title reveal" style="font-size:clamp(18px,2.3vw,22px);margin-top:40px">Conductores y entregas en el mapa</h3>
    <div class="gps-wrap reveal" id="demo-gps">
      <div>
        <svg id="gps-svg" viewBox="0 0 320 200" role="img" aria-label="Mapa de ejemplo con tres conductores en ruta"></svg>
        <p id="gps-det"></p>
        <button type="button" class="enviar" id="gps-accion" style="max-width:320px"></button>
      </div>
      <div class="dm-panel"><h5>Entregas de hoy</h5><p>Toque una entrega para verla en el mapa y cambiar su estado, como lo haría el conductor.</p><div id="gps-lista"></div></div>
    </div>
    <p class="demo-nota reveal">Movimiento simulado. En el sistema real, la posición viene del celular del conductor durante su turno.</p>
  </div>
</section>

<section class="chapter">
  <div class="wrap">
${head2('Un pedido, de', 'punta a punta')}
    <p class="lede reveal">Así se conectan los módulos. Cada paso deja su registro, así que nada depende de la memoria de nadie.</p>
    <div class="flow">
${step('01', 'El cliente pide', 'Por el vendedor, en la tienda, en la web o por el chatbot. El sistema le muestra el stock real y su precio.')}
${step('02', 'Se confirma y se factura', 'El pedido se convierte en remisión o factura, y la cartera del cliente se actualiza.')}
${step('03', 'Bodega alista por lote', 'Se despacha primero lo que vence primero, y queda anotado de qué lote salió cada producto.')}
${step('04', 'El conductor recibe su ruta', 'Ve las entregas en orden, y el cliente puede seguir el pedido con un enlace.')}
${step('05', 'Entrega con evidencia', 'Foto y nombre de quien recibe, cobro contra entrega y novedades registradas.')}
${step('06', 'Los datos se actualizan solos', 'Inventario, cartera, reportes del dueño y comisión del vendedor se actualizan sin digitar nada.')}
    </div>
  </div>
</section>

<section class="chapter">
  <div class="wrap">
${head2('Información', 'segura y suya')}
    <div class="check">
${chk('<b>Cada quien ve lo suyo.</b> Vendedores, bodega, conductores, caja y administración tienen accesos distintos.')}
${chk('<b>Historial de cambios.</b> Se sabe quién hizo qué y cuándo, y lo pagado no se puede alterar.')}
${chk('<b>Datos protegidos.</b> Los datos de clientes y empleados se tratan conforme a la Ley 1581 de protección de datos personales.')}
${chk('<b>En la nube, con respaldo.</b> La información no vive en un solo computador. La frecuencia del respaldo se define en el diagnóstico.')}
${chk('<b>Sus datos son suyos.</b> Todo se puede exportar a Excel en cualquier momento.')}
    </div>
  </div>
</section>

<section class="chapter">
  <div class="wrap">
${head2('Cómo lo', 'implementamos')}
    <p class="lede reveal">Por fases, para que el negocio no se detenga: cada fase se entrega funcionando, con el equipo capacitado, y se aprueba antes de pasar a la siguiente.</p>
    <div class="flow">
${step('00', 'Diagnóstico', 'El Estratega recorre la bodega, las ventas y el reparto, y define con ustedes las prioridades y el calendario.')}
${step('01', 'Base del sistema', 'Catálogo de más de 800 productos, inventario por lotes, base de clientes y panel del dueño. Se carga desde sus archivos actuales.')}
${step('02', 'Ventas y facturación', 'Pantalla de vendedores, pedido en tienda, cotizaciones, facturas y cartera.')}
${step('03', 'Reparto', 'Domicilios, app de conductores y GPS.')}
${step('04', 'Equipo', 'Sistema de empleados, turnos, asistencia y nómina.')}
${step('05', 'Web, fotos y chatbot', 'Sesión fotográfica, página web con recetarios y chatbot en WhatsApp.')}
    </div>
    <p class="nota-honesta reveal">El orden de las fases lo ajustamos en el diagnóstico según lo que más le duela hoy al negocio. Por ejemplo, si el reparto es la prioridad, puede ir antes.</p>
  </div>
</section>


<section class="chapter">
  <div class="wrap">
${head2('Lo que necesitamos', 'de ustedes')}
    <div class="check">
${chk('<b>El listado de productos</b> en Excel, con presentaciones, códigos y precios, aunque esté incompleto.')}
${chk('<b>Un responsable</b> que apruebe y resuelva dudas durante el proyecto.')}
${chk('<b>Los datos de empleados, turnos y conductores</b> para configurar el equipo.')}
${chk('<b>Celulares con datos</b> para conductores y personal de bodega, o tablets en los puntos fijos.')}
${chk('<b>Un número de WhatsApp Business</b> para el chatbot, y la elección de un proveedor de factura electrónica.')}
    </div>
  </div>
</section>

<section class="chapter">
  <div class="wrap">
${head2('Y cuando quieran', 'crecer en redes')}
    <p class="lede reveal">Magnus Company también puede adquirir por aparte nuestros servicios de gestión de redes sociales, pauta publicitaria y creación y estrategia de contenido.</p>
    <div class="tarjeta reveal" style="max-width:860px">
      <div class="badge"><i></i>Servicio adicional · Personalizado</div>
      <p class="statement" style="margin-top:0">No manejamos planes genéricos. El servicio se adapta a la empresa, no la empresa al servicio.</p>
      <p class="lede" style="margin:0">Definimos entregables a la medida: cuántas piezas, en qué redes, con qué presupuesto de pauta y con qué objetivo (más pedidos, nuevos clientes o más visitas al catálogo).</p>
    </div>
  </div>
</section>

<section class="chapter" id="proximos">
  <div class="wrap">
${head2('Próximos', 'pasos')}
    <div class="flow">
${step('01', 'Reunión', 'Escuchamos cómo se vende, se almacena y se reparte hoy, les explicamos cómo sería el trabajo por fases y resolvemos todas sus preguntas.')}
${step('02', 'Firma del contrato y primer pago', 'El proyecto se formaliza bajo contrato. Con el primer pago queda reservado el equipo de SYSMOOO.')}
${step('03', 'Inicio de la primera fase', 'Arrancamos con el diagnóstico en su operación y la base del sistema: catálogo, inventario por lotes, clientes y panel del dueño.')}
    </div>
  </div>
</section>

<section class="chapter" id="comienzo">
  <div class="wrap">
${head2('Esto es solo', 'el comienzo')}
    <p class="statement reveal">${HOJA}Lo que ven en esta propuesta es la base. El sistema está hecho para crecer con Magnus Company.</p>
    <p class="lede reveal">Cada negocio descubre nuevas necesidades cuando empieza a trabajar con todo ordenado y a la mano. Por eso el sistema no se cierra: se pueden construir muchas más cosas, según lo que pidan los dueños, a medida que la operación crezca. Cada ampliación se conversa, se cotiza antes de hacerla y se entrega por fases, igual que este proyecto.</p>
    <div class="check">
${chk('<b>Más módulos a la medida.</b> Compras a proveedores, órdenes de compra y cuentas por pagar, o lo que la operación pida después.')}
${chk('<b>Un portal para sus clientes.</b> Que cada cliente haga sus pedidos, vea su cartera y descargue sus facturas por su cuenta.')}
${chk('<b>Tienda en línea.</b> Venta con pago en línea para clientes pequeños, conectada al mismo inventario.')}
${chk('<b>Rutas más inteligentes.</b> Ordenar las entregas del día por zona y por tiempo, para gastar menos combustible.')}
${chk('<b>Conexión con otros sistemas.</b> Contabilidad, bancos, transportadoras o plataformas que Magnus ya use.')}
${chk('<b>Más sedes, más bodegas, más vendedores.</b> El sistema crece con el negocio, sin empezar de cero.')}
${chk('<b>Mejoras que ustedes pidan.</b> Cada idea de los dueños se escucha, se evalúa y, si tiene sentido, se construye.')}
    </div>
  </div>
</section>

<footer>
  <div class="wrap">
    <div class="logos">${sysmo('sysmo-mark big')}<span class="x">×</span>${foto('cliente-mini')}</div>
    <p>SYSMOOO — Propuesta para Magnus Company Colombia · Este es solo el comienzo</p>
  </div>
</footer>

<script>
(function(){
  var root = document.documentElement;
  document.querySelector('.hero-doc').classList.add('in');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var els = [].slice.call(document.querySelectorAll('.reveal'));
  if (reduce || !('IntersectionObserver' in window)){ els.forEach(function(el){ el.classList.add('in'); }); return; }
  var vh = window.innerHeight;
  els.forEach(function(el){ if (el.getBoundingClientRect().top < vh * 0.92) el.classList.add('in'); });
  root.classList.add('anim');
  var io = new IntersectionObserver(function(entries){ entries.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } }); }, { threshold:0, rootMargin:'0px 0px -6% 0px' });
  els.forEach(function(el){ if (!el.classList.contains('in')) io.observe(el); });
})();
</script>
<script>
${fs.readFileSync(DIR + 'interactivo.js', 'utf8')}
</script>

</body>
</html>
`;

// Favicon: isologo de SYSMOOO (recursos/sysmo-isologo-favicon.png)
const favB64 = 'data:image/png;base64,' + fs.readFileSync(ROOT + 'recursos/sysmo-isologo-favicon.png').toString('base64');
const favicon = `\n<link rel="icon" type="image/png" href="${favB64}">\n<link rel="apple-touch-icon" href="${favB64}">`;
const out = (head + css2 + '</style>\n</head>\n<body>\n' + body).replace('<title>Propuesta Magnus Company</title>', '<title>Propuesta Magnus Company</title>' + favicon);
fs.writeFileSync(DIR + 'propuesta-magnus-company.html', out);
fs.mkdirSync(DIR + 'cloudflare', { recursive: true });
fs.writeFileSync(DIR + 'cloudflare/index.html', out.replace('<meta charset="UTF-8">', '<meta charset="UTF-8">\n<meta name="robots" content="noindex, nofollow">'));
// Versión para link de Claude: sin html/head/body propios y todo visible sin hacer scroll.
const noHide = '  .anim .reveal:not(.in), .anim .giant-block:not(.in) .fig img{ opacity:1; transform:none; }\n';
const pub = out.slice(out.indexOf('<title>')).replace('</style>\n</head>\n<body>', noHide + '</style>').replace(/<\/body>\s*<\/html>\s*$/, '');
fs.writeFileSync(DIR + 'propuesta-magnus-company-artifact.html', pub);
try { new Function(fs.readFileSync(DIR + 'interactivo.js', 'utf8')); } catch (e) { console.error('ERROR en interactivo.js:', e.message); process.exit(1); }
console.log('OK ·', (out.length / 1024).toFixed(0), 'KB · capítulos:', cap, '· sin <html> en la versión de Claude:', !/<\/?(html|head|body)[\s>]/i.test(pub));
