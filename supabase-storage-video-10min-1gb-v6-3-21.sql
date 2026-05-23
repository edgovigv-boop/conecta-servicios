-- Conecta Servicios v6.3.21
-- Permitir videos de hasta 10 minutos con peso máximo de 1 GB en Supabase Storage.
-- Ejecutar en Supabase > SQL Editor > New query > Run.
--
-- IMPORTANTE:
-- 10 minutos no equivale a un peso fijo. Un video de 3 minutos puede pesar más de 300 MB
-- si se grabó en alta calidad. Por eso se sube el límite del bucket a 1 GB.

update storage.buckets
set
  public = true,
  file_size_limit = 1073741824,
  allowed_mime_types = array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-m4v'
  ]
where id = 'publication-media';

select
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
from storage.buckets
where id = 'publication-media';
