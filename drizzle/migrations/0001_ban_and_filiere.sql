ALTER TABLE public.profiles ADD COLUMN banned boolean NOT NULL DEFAULT false;
ALTER TABLE public.reservations ADD COLUMN filiere text;
ALTER TABLE public.reservations ADD COLUMN td_group integer NOT NULL DEFAULT 1;
ALTER TABLE public.reservations ADD CONSTRAINT reservations_td_group_check CHECK (td_group BETWEEN 1 AND 8);

CREATE POLICY "profiles admin update" ON public.profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.protect_banned()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF new.banned IS DISTINCT FROM old.banned AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Seul un gestionnaire peut modifier ce statut';
  END IF;
  IF new.banned AND new.id = auth.uid() THEN
    RAISE EXCEPTION 'Vous ne pouvez pas vous bannir vous-même';
  END IF;
  RETURN new;
END; $$;
CREATE TRIGGER trg_protect_banned BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_banned();

CREATE OR REPLACE FUNCTION public.validate_reservation()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF new.status = 'confirmee' THEN
    IF new.ends_at - new.starts_at > interval '4 hours' THEN
      RAISE EXCEPTION 'Durée maximale dépassée (4 heures)';
    END IF;
    IF tg_op = 'INSERT' THEN
      IF (SELECT banned FROM public.profiles WHERE id = new.user_id) THEN
        RAISE EXCEPTION 'Compte suspendu : réservation impossible';
      END IF;
      IF coalesce(trim(new.filiere), '') = '' THEN
        RAISE EXCEPTION 'La filière est obligatoire';
      END IF;
      IF new.starts_at < now() THEN
        RAISE EXCEPTION 'Impossible de réserver dans le passé';
      END IF;
      IF (SELECT count(*) FROM public.reservations
          WHERE user_id = new.user_id AND status = 'confirmee' AND ends_at > now()) >= 3 THEN
        RAISE EXCEPTION 'Limite atteinte : 3 réservations actives maximum';
      END IF;
    END IF;
  END IF;
  RETURN new;
END; $$;