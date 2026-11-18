-- ============================================================================
-- ReservCampus — jeu de données initial (seed)
-- ----------------------------------------------------------------------------
-- 10 ressources d'exemple : 5 salles + 5 matériels, identiques au catalogue
-- réellement chargé dans l'instance de démonstration.
-- Les UUID sont fixes pour que `seed.sql` soit reproductible et rejouable.
-- À exécuter APRÈS schema.sql.
-- ============================================================================

-- Salles -------------------------------------------------------------------
insert into public.resources (id, name, type, capacity, location, equipments, description, active) values
  ('7ac9f7a2-cf78-42bf-b5f5-36fcb6122d4b', 'Amphi A', 'salle', 200,
   'Bâtiment A - RDC',
   array['Vidéoprojecteur', 'Micro', 'Sonorisation'],
   'Grand amphithéâtre pour cours magistraux', true),

  ('8b5d43b5-d921-44d6-8977-768b526348c5', 'Labo Info C3', 'salle', 40,
   'Bâtiment C - 2e étage',
   array['40 PC', 'Vidéoprojecteur'],
   'Salle informatique', true),

  ('922e41ce-851e-4923-a4c5-4232d6fdca41', 'Salle B12', 'salle', 30,
   'Bâtiment B - 1er étage',
   array['Vidéoprojecteur', 'Tableau blanc'],
   'Salle de TD', true),

  ('ec773006-e970-4b2c-bb71-a26771b3695e', 'Salle B14', 'salle', 24,
   'Bâtiment B - 1er étage',
   array['Écran TV', 'Tableau blanc'],
   'Salle de travail en groupe', true),

  ('a972303e-fabf-4f7f-97d6-6bcaf90ca5c0', 'Salle de réunion D1', 'salle', 12,
   'Bâtiment D',
   array['Visioconférence', 'Écran'],
   'Idéale pour soutenances', true)

on conflict (id) do nothing;

-- Matériel -----------------------------------------------------------------
insert into public.resources (id, name, type, capacity, location, equipments, description, active) values
  ('2527287c-b244-48bd-a336-430d81313c38', 'Caméra Sony', 'materiel', null,
   'Service audiovisuel',
   array['Trépied', 'Carte SD'],
   'Captation vidéo', true),

  ('e83d2204-4c88-463e-86c0-6099cb946b69', 'Kit micro sans fil', 'materiel', null,
   'Service audiovisuel',
   array['2 micros', 'Récepteur'],
   'Pour conférences', true),

  ('95e6efdf-5331-43eb-8b47-f72f6f4735df', 'Ordinateur portable Dell', 'materiel', null,
   'Service informatique',
   array['Windows 11', 'Office'],
   'PC portable de prêt', true),

  ('dcdf2f32-e7a7-45b5-b792-8bb9f9f51da9', 'Vidéoprojecteur Epson #1', 'materiel', null,
   'Accueil scolarité',
   array['HDMI', 'VGA'],
   'Vidéoprojecteur portable', true),

  ('4949e1cd-8971-4a8b-aa40-dee11c1d0fed', 'Vidéoprojecteur Epson #2', 'materiel', null,
   'Accueil scolarité',
   array['HDMI'],
   'Vidéoprojecteur portable', true)

on conflict (id) do nothing;

-- Réservations d'exemple ---------------------------------------------------
-- Aucune réservation n'est pré-insérée : les disponibilités affichées à
-- l'écran doivent refléter la réalité du moment de la démonstration.
-- Pour préparer la scène "conflit de réservation", réservez un créneau depuis
-- un compte, puis rejouez-le depuis un second compte : le refus s'affiche
-- avec les créneaux alternatifs proposés.
