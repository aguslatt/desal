-- Tablas para Umbral. Cada fila guarda un objeto JSON anónimo (sin datos personales).
-- Ejecutalo en el SQL editor de Supabase y cargá SUPABASE_URL y SUPABASE_SERVICE_KEY en Vercel.

create table if not exists reportes (id uuid primary key default gen_random_uuid(), creado timestamptz not null default now(), payload jsonb not null);
create table if not exists leads    (id uuid primary key default gen_random_uuid(), creado timestamptz not null default now(), payload jsonb not null);
create table if not exists eventos  (id uuid primary key default gen_random_uuid(), creado timestamptz not null default now(), payload jsonb not null);

-- Tablas con clave (panel de administración): cafés editados/agregados y cuentas de cafés.
-- `id` es el identificador del café o de la cuenta; la clave NUNCA se guarda, solo su hash.
create table if not exists cafes   (id text primary key, creado timestamptz not null default now(), payload jsonb not null);
create table if not exists cuentas (id text primary key, creado timestamptz not null default now(), payload jsonb not null);

-- Solo el servidor (service key) escribe y lee. Sin políticas = el público no accede.
alter table reportes enable row level security;
alter table leads    enable row level security;
alter table eventos  enable row level security;
alter table cafes    enable row level security;
alter table cuentas  enable row level security;
