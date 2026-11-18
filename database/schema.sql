-- ============================================================================
-- ReservCampus — schéma de référence (PostgreSQL)
-- ----------------------------------------------------------------------------
-- Copie lisible et commentée du schéma réellement appliqué sur l'instance
-- Lovable Cloud. Les migrations appliquées restent la source de vérité ;
-- ce fichier sert de documentation technique et de point de reproduction.
--
-- Ordre d'exécution : schema.sql puis seed.sql
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
-- pgcrypto   : gen_random_uuid() pour les clés primaires
-- btree_gist : nécessaire à la contrainte EXCLUDE USING gist (resource_id WITH =)
create extension if not exists pgcrypto;
create extension if not exists btree_gist;

-- ---------------------------------------------------------------------------
-- Types énumérés
-- ---------------------------------------------------------------------------
create type public.app_role as enum ('admin', 'user');
create type public.resource_type as enum ('salle', 'materiel');

-- ---------------------------------------------------------------------------
-- profiles : miroir public de auth.users (créé automatiquement à l'inscription)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text not null default '',
  email      text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- resources : catalogue des salles et du matériel réservables
-- ---------------------------------------------------------------------------
create table public.resources (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  type        public.resource_type not null,
  capacity    integer,                       -- NULL pour le matériel
  location    text,
  equipments  text[] not null default '{}',
  description text,
  active      boolean not null default true, -- désactivée = retirée du catalogue
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- user_roles : rôles applicatifs, stockés hors de la portée de l'utilisateur
-- (jamais déduits des metadata d'auth, qui sont modifiables côté client)
-- ---------------------------------------------------------------------------
create table public.user_roles (
  id      uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role    public.app_role not null,
  unique (user_id, role)
);

-- ---------------------------------------------------------------------------
-- reservations : le cœur métier
-- ---------------------------------------------------------------------------
create table public.reservations (
  id          uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  purpose     text,
  status      text not null default 'confirmee'
              check (status in ('confirmee', 'annulee')),
  created_at  timestamptz not null default now(),

  constraint reservations_check check (ends_at > starts_at),

  -- RÈGLE CENTRALE : zéro double réservation.
  -- Deux réservations 'confirmee' de la même ressource ne peuvent pas avoir
  -- des intervalles [start, end) qui se chevauchent. Le contrôle est garanti
  -- par la base, donc même si deux requêtes partent en même temps ou si une
  -- vérification applicative est oubliée, la seconde insertion est refusée.
  -- L'index gist associé (no_overlap) est créé automatiquement par la contrainte.
  constraint no_overlap exclude using gist (
    resource_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status = 'confirmee')
);

-- ---------------------------------------------------------------------------
-- Fonctions
-- ---------------------------------------------------------------------------

-- has_role : seule façon fiable de tester un rôle (utilisables dans les RLS).
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  );
$$;

-- handle_new_user : au signup, crée le profil + le rôle 'user'.
-- Le tout premier compte du système reçoit aussi 'admin' (pas de compte
-- gestionnaire à créer à la main pour la démo).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email
  );

  insert into public.user_roles (user_id, role) values (new.id, 'user');

  if (select count(*) from public.user_roles where role = 'admin') = 0 then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;

  return new;
end;
$$;

-- validate_reservation : règles d'équité appliquées côté serveur, donc
-- impossibles à contourner depuis l'interface.
create or replace function public.validate_reservation()
returns trigger
language plpgsql
set search_path = public
as $$
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
          where user_id = new.user_id
            and status = 'confirmee'
            and ends_at > now()) >= 3 then
        raise exception 'Limite atteinte : 3 réservations actives maximum';
      end if;
    end if;
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create trigger trg_validate_reservation
  before insert or update on public.reservations
  for each row execute function public.validate_reservation();

-- ---------------------------------------------------------------------------
-- Row Level Security : les tables sont verrouillées par défaut, puis
-- précisément ouvertes. Sans politique, aucune lecture/écriture n'est possible.
-- ---------------------------------------------------------------------------
alter table public.profiles    enable row level security;
alter table public.resources   enable row level security;
alter table public.user_roles  enable row level security;
alter table public.reservations enable row level security;

-- profiles : chacun voit son profil, un admin voit tous les profils ;
-- l'utilisateur ne modifie que le sien.
create policy "profiles read" on public.profiles
  for select to authenticated
  using (id = auth.uid() or has_role(auth.uid(), 'admin'));

create policy "profiles update own" on public.profiles
  for update to authenticated
  using (id = auth.uid());

-- resources : tout utilisateur connecté consulte le catalogue ;
-- seul un admin crée, modifie ou supprime.
create policy "resources read" on public.resources
  for select to authenticated using (true);

create policy "resources admin insert" on public.resources
  for insert to authenticated
  with check (has_role(auth.uid(), 'admin'));

create policy "resources admin update" on public.resources
  for update to authenticated
  using (has_role(auth.uid(), 'admin'));

create policy "resources admin delete" on public.resources
  for delete to authenticated
  using (has_role(auth.uid(), 'admin'));

-- user_roles : lecture de ses propres rôles (ou tous si admin).
-- Aucune écriture autorisée : les rôles ne sont manipulables que par la
-- fonction handle_new_user (security definer) ou un administrateur de base.
create policy "own roles readable" on public.user_roles
  for select to authenticated
  using (user_id = auth.uid() or has_role(auth.uid(), 'admin'));

-- reservations : on insère uniquement pour soi ; on lit tout (indispensable
-- pour calculer les disponibilités) ; on annule la sienne ou, si admin,
-- celle d'un autre.
create policy "reservations insert own" on public.reservations
  for insert to authenticated
  with check (user_id = auth.uid());

create policy "reservations read" on public.reservations
  for select to authenticated using (true);

create policy "reservations update own or admin" on public.reservations
  for update to authenticated
  using (user_id = auth.uid() or has_role(auth.uid(), 'admin'));

-- Le DELETE n'est volontairement pas ouvert : l'annulation passe par
-- status = 'annulee', ce qui conserve l'historique et la traçabilité.

commit;
