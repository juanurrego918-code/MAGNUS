-- Fotos de entrada de turno y de entrega: bucket privado, cada conductor sube solo a su carpeta, el dueño las lee.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('evidencias', 'evidencias', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy evidencias_subir on storage.objects for insert to authenticated
  with check (bucket_id = 'evidencias' and (storage.foldername(name))[1] = auth.uid()::text and public.has_role('conductor'));
create policy evidencias_leer on storage.objects for select to authenticated
  using (bucket_id = 'evidencias' and (public.is_owner() or (storage.foldername(name))[1] = auth.uid()::text));
