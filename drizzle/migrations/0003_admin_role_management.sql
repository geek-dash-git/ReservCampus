CREATE OR REPLACE FUNCTION public.set_admin_role(_target uuid, _grant boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _email text; _banned boolean;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  IF _target = auth.uid() AND NOT _grant THEN RAISE EXCEPTION 'Vous ne pouvez pas retirer votre propre rôle'; END IF;
  SELECT email, banned INTO _email, _banned FROM public.profiles WHERE id = _target;
  IF NOT FOUND THEN RAISE EXCEPTION 'Utilisateur introuvable'; END IF;
  IF _grant THEN
    IF _banned THEN RAISE EXCEPTION 'Impossible de nommer un compte banni'; END IF;
    INSERT INTO public.user_roles(user_id, role) VALUES (_target, 'admin') ON CONFLICT DO NOTHING;
  ELSE
    DELETE FROM public.user_roles WHERE user_id = _target AND role = 'admin';
  END IF;
  INSERT INTO public.admin_audit(actor, action, target, details)
  VALUES (auth.uid(), CASE WHEN _grant THEN 'gestionnaire_nomme' ELSE 'gestionnaire_retire' END, _target::text, jsonb_build_object('email', _email));
END; $$;
REVOKE ALL ON FUNCTION public.set_admin_role(uuid, boolean) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.set_admin_role(uuid, boolean) TO authenticated;