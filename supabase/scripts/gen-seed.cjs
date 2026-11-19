// Genera supabase/seed.sql a partir de los datos de ejemplo del diseño (docs/diseno-referencia/magnus-store.js).
const fs = require('fs'), path = require('path'), vm = require('vm');
const src = fs.readFileSync(path.join(__dirname, '../../docs/diseno-referencia/magnus-store.js'), 'utf8');
const store = {};
const win = { localStorage: { getItem: () => null, setItem() {} }, addEventListener() {}, dispatchEvent() {}, Event: function () {} };
vm.runInNewContext(src, { window: win, localStorage: win.localStorage, Event: win.Event }, {});
const s = win.MG.get();
const q = (v) => v == null ? 'null' : "'" + String(v).replace(/'/g, "''") + "'";
const hoy = new Date(s.hoy + 'T12:00:00');
const off = (iso) => Math.round((new Date(iso + 'T12:00:00') - hoy) / 864e5);
const cats = [...new Set(s.products.map(p => p.cat))];
let o = '-- Generado por supabase/scripts/gen-seed.cjs. Datos de ejemplo (no son datos reales de Magnus).\n';
o += "insert into public.price_lists (name, factor, round_to) values ('Mayorista', 1, 50), ('Distribuidor', 0.96, 50);\n";
o += "insert into public.discount_tiers (min_total, rate) values (1000000, 0.03), (3000000, 0.05);\n";
o += "insert into public.warehouses (name) values ('Principal');\n";
o += 'insert into public.categories (name) values ' + cats.map(c => '(' + q(c) + ')').join(', ') + ';\n';
for (const p of s.products) {
  o += `insert into public.products (code, ean, name, brand, category_id, min_units, active) values (${q(p.code)}, ${q(p.ean)}, ${q(p.name)}, ${q(p.brand)}, (select id from public.categories where name = ${q(p.cat)}), ${p.min}, ${p.active});\n`;
  o += `insert into public.product_costs (product_id, cost) select id, ${p.cost} from public.products where code = ${q(p.code)};\n`;
  for (const pr of p.pres)
    o += `insert into public.presentations (product_id, name, units, price) select id, ${q(pr.name)}, ${pr.units}, ${pr.price} from public.products where code = ${q(p.code)};\n`;
  for (const l of p.lots)
    o += `insert into public.lots (product_id, lot_code, expires_on, qty_units, warehouse_id) select id, ${q(l.lot)}, current_date + ${off(l.exp)}, ${l.qty}, (select id from public.warehouses where name = 'Principal') from public.products where code = ${q(p.code)};\n`;
}
for (const c of s.clients) {
  o += `insert into public.clients (name, nit, price_list_id, city, contact_name, contact_phone, credit_days) values (${q(c.name)}, ${q(c.nit)}, (select id from public.price_lists where name = ${q(c.list)}), ${q(c.city)}, ${q(c.contact && c.contact.name)}, ${q(c.contact && c.contact.phone)}, ${c.credit || 0});\n`;
  for (const a of c.addr)
    o += `insert into public.client_addresses (client_id, label, address) select id, ${q(a.label)}, ${q(a.text)} from public.clients where nit = ${q(c.nit)};\n`;
}
fs.writeFileSync(path.join(__dirname, '../seed.sql'), o);
console.log('seed.sql', s.products.length, 'productos', s.clients.length, 'clientes');
