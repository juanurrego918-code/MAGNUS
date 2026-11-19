-- Supabase concede privilegios por defecto a anon/authenticated en objetos nuevos: se retiran y se conceden solo los necesarios.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon;
grant select on public.profiles, public.audit_log, public.categories, public.products,
  public.product_costs, public.presentations, public.price_lists, public.discount_tiers,
  public.warehouses, public.lots, public.inventory_movements, public.clients,
  public.client_addresses, public.product_stock,
  public.orders, public.order_lines, public.order_picks, public.invoices, public.payments,
  public.cash_closes, public.receivables, public.warehouse_queue to authenticated;
grant insert, update, delete on public.profiles, public.categories, public.products,
  public.product_costs, public.presentations, public.price_lists, public.discount_tiers,
  public.warehouses, public.clients, public.client_addresses to authenticated;
grant execute on function public.auth_role(), public.is_owner(), public.has_role(public.app_role[]),
  public.price_for(bigint, bigint), public.volume_rate(numeric), public.fefo_allocate(bigint, integer),
  public.receive_lot(bigint, text, date, integer, smallint), public.adjust_inventory(bigint, integer, text),
  public.create_order(bigint, jsonb, text, text, text, text, text, text), public.pick_order(bigint),
  public.invoice_order(bigint, text), public.register_payment(bigint, numeric, text),
  public.annul_invoice(bigint, text), public.close_cash(numeric, numeric, text), public.cop_text(numeric) to authenticated;
-- Objetos futuros: sin privilegios automáticos para anon/authenticated.
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon;
