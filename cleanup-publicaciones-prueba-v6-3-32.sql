-- Conecta Servicios v6.3.32
-- Limpieza controlada de publicaciones de prueba.
-- Ejecuta primero el SELECT para revisar.
-- Dueño principal detectado en pruebas: u-1779553464660-29cf7b7b941408

-- 1) Revisar publicaciones actuales
select
  client_id,
  owner_id,
  status,
  data->>'title' as title,
  data->>'category' as category,
  data->>'mediaType' as media_type,
  data->>'mediaStatus' as media_status,
  created_at,
  updated_at
from connecta_publications
order by created_at desc;

-- 2) Borrar publicaciones que NO son del dueño principal
-- Descomenta SOLO si ya revisaste el SELECT anterior.
-- delete from connecta_publications
-- where coalesce(owner_id, data->>'ownerId', '') <> 'u-1779553464660-29cf7b7b941408';

-- 3) Borrar publicaciones fallidas o de video sin mediaUrl
-- Descomenta SOLO si quieres limpiar errores de prueba.
-- delete from connecta_publications
-- where coalesce(data->>'mediaStatus','') = 'error'
--    or (data->>'mediaType' = 'video' and coalesce(data->>'mediaUrl','') = '');

-- 4) Borrar IDs específicos de pruebas antiguas
-- Pega aquí los client_id exactos que quieras eliminar:
-- delete from connecta_publications
-- where client_id in (
--   'post-PEGAR-ID-AQUI'
-- );

-- 5) Verificar resultado
select
  client_id,
  owner_id,
  status,
  data->>'title' as title,
  data->>'category' as category,
  created_at
from connecta_publications
order by created_at desc;
