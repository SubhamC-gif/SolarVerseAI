create type public.app_role as enum ('homeowner', 'operator');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  city text,
  state text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile select" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = id);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "own role select" on public.user_roles for select to authenticated using (auth.uid() = user_id);
create policy "own role insert" on public.user_roles for insert to authenticated with check (auth.uid() = user_id);
create policy "own role update" on public.user_roles for update to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  title text not null,
  city text,
  capacity_kw numeric not null,
  annual_kwh numeric not null,
  cost numeric not null,
  annual_savings numeric not null,
  payback_years numeric,
  inputs jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
grant select, insert, delete on public.assessments to authenticated;
grant all on public.assessments to service_role;
alter table public.assessments enable row level security;
create policy "own assessments" on public.assessments for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.plants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  name text not null,
  capacity_kw numeric not null,
  location text,
  latitude double precision,
  longitude double precision,
  panel_spec text,
  inverter_spec text,
  commissioned_on date,
  notes text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.plants to authenticated;
grant all on public.plants to service_role;
alter table public.plants enable row level security;
create policy "own plants" on public.plants for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.inspections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  plant_id uuid references public.plants(id) on delete set null,
  kind text not null check (kind in ('fault', 'soiling')),
  image_path text not null,
  result jsonb,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.inspections to authenticated;
grant all on public.inspections to service_role;
alter table public.inspections enable row level security;
create policy "own inspections" on public.inspections for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.maintenance_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  plant_id uuid references public.plants(id) on delete cascade,
  title text not null,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  due_on date,
  done boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.maintenance_tasks to authenticated;
grant all on public.maintenance_tasks to service_role;
alter table public.maintenance_tasks enable row level security;
create policy "own tasks" on public.maintenance_tasks for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own inspection files read" on storage.objects for select to authenticated using (bucket_id = 'inspections' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own inspection files write" on storage.objects for insert to authenticated with check (bucket_id = 'inspections' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own inspection files delete" on storage.objects for delete to authenticated using (bucket_id = 'inspections' and (storage.foldername(name))[1] = auth.uid()::text);