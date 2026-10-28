-- Tablas para Umbral. Cada fila guarda un objeto JSON anónimo (sin datos personales).
-- Ejecutalo en el SQL editor de Supabase y cargá SUPABASE_URL y SUPABASE_SERVICE_KEY en Vercel.

create table if not exists reportes (id uuid primary key default gen_random_uuid(), creado timestamptz not null default now(), payload jsonb not null);
create table if not exists leads    (id uuid primary key default gen_random_uuid(), creado timestamptz not null default now(), payload jsonb not null);
create table if not exists eventos  (id uuid primary key default gen_random_uuid(), creado timestamptz not null default now(), payload jsonb not null);

-- Solo el servidor (service key) escribe y lee. Sin políticas = el público no accede.
alter table reportes enable row level security;
alter table leads    enable row level security;
alter table eventos  enable row level security;
