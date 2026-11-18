ALTER TABLE public.reservations DROP CONSTRAINT reservations_status_check;
ALTER TABLE public.reservations ADD CONSTRAINT reservations_status_check
  CHECK (status IN ('en_attente','confirmee','refusee','annulee'));
ALTER TABLE public.reservations ALTER COLUMN status SET DEFAULT 'en_attente';
ALTER TABLE public.reservations DROP CONSTRAINT no_overlap;
ALTER TABLE public.reservations ADD CONSTRAINT no_overlap EXCLUDE USING gist (
  resource_id WITH =, tstzrange(starts_at, ends_at, '[)') WITH &&
) WHERE (status IN ('confirmee','en_attente'));

-- Confidentialité : lecture limitée à soi ou admin
DROP POLICY "reservations read" ON public.reservations;
CREATE POLICY "reservations read own or admin" ON public.reservations FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Créneaux occupés, sans données personnelles
CREATE OR REPLACE FUNCTION public.busy_slots(_resource uuid, _from timestamptz, _to timestamptz)
RETURNS TABLE(starts_at timestamptz, ends_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT r.starts_at, r.ends_at FROM public.reservations r
  WHERE auth.uid() IS NOT NULL AND r.resource_id = _resource
    AND r.status IN ('confirmee','en_attente') AND r.starts_at < _to AND r.ends_at > _from;
$$;
CREATE OR REPLACE FUNCTION public.busy_resources(_from timestamptz, _to timestamptz)
RETURNS TABLE(resource_id uuid)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT DISTINCT r.resource_id FROM public.reservations r
  WHERE auth.uid() IS NOT NULL AND r.status IN ('confirmee','en_attente')
    AND r.starts_at < _to AND r.ends_at > _from;
$$;
REVOKE ALL ON FUNCTION public.busy_slots(uuid,timestamptz,timestamptz) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.busy_resources(timestamptz,timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.busy_slots(uuid,timestamptz,timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.busy_resources(timestamptz,timestamptz) TO authenticated;

CREATE OR REPLACE FUNCTION public.validate_reservation()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE is_admin boolean := public.has_role(auth.uid(), 'admin');
BEGIN
  IF tg_op = 'INSERT' THEN
    IF NOT is_admin THEN new.status := 'en_attente'; END IF;
    IF (SELECT banned FROM public.profiles WHERE id = new.user_id) THEN
      RAISE EXCEPTION 'Compte suspendu : réservation impossible';
    END IF;
    IF coalesce(trim(new.filiere), '') = '' THEN RAISE EXCEPTION 'La filière est obligatoire'; END IF;
    IF length(coalesce(new.purpose,'')) > 300 OR length(new.filiere) > 80 THEN
      RAISE EXCEPTION 'Texte trop long';
    END IF;
    IF new.starts_at < now() THEN RAISE EXCEPTION 'Impossible de réserver dans le passé'; END IF;
    IF new.ends_at - new.starts_at > interval '4 hours' THEN RAISE EXCEPTION 'Durée maximale dépassée (4 heures)'; END IF;
    IF (SELECT count(*) FROM public.reservations WHERE user_id = new.user_id
        AND status IN ('confirmee','en_attente') AND ends_at > now()) >= 3 THEN
      RAISE EXCEPTION 'Limite atteinte : 3 réservations actives maximum';
    END IF;
  ELSE
    IF NOT is_admin THEN
      IF new.status <> 'annulee' OR old.status NOT IN ('confirmee','en_attente')
         OR new.resource_id <> old.resource_id OR new.user_id <> old.user_id
         OR new.starts_at <> old.starts_at OR new.ends_at <> old.ends_at
         OR new.purpose IS DISTINCT FROM old.purpose OR new.filiere IS DISTINCT FROM old.filiere
         OR new.td_group <> old.td_group THEN
        RAISE EXCEPTION 'Action non autorisée';
      END IF;
    END IF;
  END IF;
  RETURN new;
END; $$;

-- Journal d'audit (lecture admin, aucune écriture directe)
CREATE TABLE public.admin_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor uuid,
  action text NOT NULL,
  target text,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_audit TO authenticated;
GRANT ALL ON public.admin_audit TO service_role;
ALTER TABLE public.admin_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit admin read" ON public.admin_audit FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.log_admin_action()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RETURN coalesce(new, old); END IF;
  IF tg_table_name = 'reservations' THEN
    IF new.status IS DISTINCT FROM old.status THEN
      INSERT INTO public.admin_audit(actor, action, target, details)
      VALUES (auth.uid(), 'reservation_' || new.status, new.id::text, jsonb_build_object('avant', old.status));
    END IF;
  ELSIF tg_table_name = 'profiles' THEN
    IF new.banned IS DISTINCT FROM old.banned THEN
      INSERT INTO public.admin_audit(actor, action, target, details)
      VALUES (auth.uid(), CASE WHEN new.banned THEN 'utilisateur_banni' ELSE 'utilisateur_reactive' END, new.id::text, jsonb_build_object('email', new.email));
    END IF;
  ELSIF tg_table_name = 'resources' THEN
    INSERT INTO public.admin_audit(actor, action, target, details)
    VALUES (auth.uid(), 'ressource_' || lower(tg_op), coalesce(new.id, old.id)::text, jsonb_build_object('nom', coalesce(new.name, old.name)));
  END IF;
  RETURN coalesce(new, old);
END; $$;
CREATE TRIGGER trg_audit_reservations AFTER UPDATE ON public.reservations FOR EACH ROW EXECUTE FUNCTION public.log_admin_action();
CREATE TRIGGER trg_audit_profiles AFTER UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.log_admin_action();
CREATE TRIGGER trg_audit_resources AFTER INSERT OR UPDATE OR DELETE ON public.resources FOR EACH ROW EXECUTE FUNCTION public.log_admin_action();