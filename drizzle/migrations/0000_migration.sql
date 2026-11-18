create extension if not exists btree_gist;

create type public.app_role as enum ('admin','user');
create type public.resource_type as enum ('salle','materiel');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

create policy "own roles readable" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "profiles read" on public.profiles for select to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "profiles update own" on public.profiles for update to authenticated using (id = auth.uid());

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type resource_type not null,
  capacity int,
  location text,
  equipments text[] not null default '{}',
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.resources to authenticated;
grant all on public.resources to service_role;
alter table public.resources enable row level security;
create policy "resources read" on public.resources for select to authenticated using (true);
create policy "resources admin insert" on public.resources for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy "resources admin update" on public.resources for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "resources admin delete" on public.resources for delete to authenticated using (public.has_role(auth.uid(),'admin'));

create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  purpose text,
  status text not null default 'confirmee' check (status in ('confirmee','annulee')),
  created_at timestamptz not null default now(),
  check (ends_at > starts_at),
  constraint no_overlap exclude using gist (
    resource_id with =, tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status = 'confirmee')
);
grant select, insert, update on public.reservations to authenticated;
grant all on public.reservations to service_role;
alter table public.reservations enable row level security;
-- everyone can see occupied slots (needed for availability)
create policy "reservations read" on public.reservations for select to authenticated using (true);
create policy "reservations insert own" on public.reservations for insert to authenticated with check (user_id = auth.uid());
create policy "reservations update own or admin" on public.reservations for update to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

-- business rules: max 4h, max 3 active future reservations, no past booking
create or replace function public.validate_reservation()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.status = 'confirmee' then
    if new.ends_at - new.starts_at > interval '4 hours' then
      raise exception 'Durée maximale dépassée (4 heures)';
    end if;
    if tg_op = 'INSERT' then
      if new.starts_at < now() then
        raise exception 'Impossible de réserver dans le passé';
      end if;
      if (select count(*) from public.reservations
          where user_id = new.user_id and status = 'confirmee' and ends_at > now()) >= 3 then
        raise exception 'Limite atteinte : 3 réservations actives maximum';
      end if;
    end if;
  end if;
  return new;
end $$;
create trigger trg_validate_reservation before insert or update on public.reservations
for each row execute function public.validate_reservation();

-- profile + role on signup; first user becomes admin
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)), new.email);
  insert into public.user_roles (user_id, role) values (new.id, 'user');
  if (select count(*) from public.user_roles where role = 'admin') = 0 then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.resources (name, type, capacity, location, equipments, description) values
('Amphi A', 'salle', 200, 'Bâtiment A - RDC', '{Vidéoprojecteur,Micro,Sonorisation}', 'Grand amphithéâtre pour cours magistraux'),
('Salle B12', 'salle', 30, 'Bâtiment B - 1er étage', '{Vidéoprojecteur,Tableau blanc}', 'Salle de TD'),
('Salle B14', 'salle', 24, 'Bâtiment B - 1er étage', '{Écran TV,Tableau blanc}', 'Salle de travail en groupe'),
('Labo Info C3', 'salle', 40, 'Bâtiment C - 2e étage', '{40 PC,Vidéoprojecteur}', 'Salle informatique'),
('Salle de réunion D1', 'salle', 12, 'Bâtiment D', '{Visioconférence,Écran}', 'Idéale pour soutenances'),
('Vidéoprojecteur Epson #1', 'materiel', null, 'Accueil scolarité', '{HDMI,VGA}', 'Vidéoprojecteur portable'),
('Vidéoprojecteur Epson #2', 'materiel', null, 'Accueil scolarité', '{HDMI}', 'Vidéoprojecteur portable'),
('Ordinateur portable Dell', 'materiel', null, 'Service informatique', '{Windows 11,Office}', 'PC portable de prêt'),
('Kit micro sans fil', 'materiel', null, 'Service audiovisuel', '{2 micros,Récepteur}', 'Pour conférences'),
('Caméra Sony', 'materiel', null, 'Service audiovisuel', '{Trépied,Carte SD}', 'Captation vidéo');