export function passwordError(p: string): string | null {
  if (p.length < 10) return "Mot de passe trop court (10 caractères minimum).";
  if (!/[a-z]/.test(p) || !/[A-Z]/.test(p) || !/\d/.test(p) || !/[^A-Za-z0-9]/.test(p))
    return "Le mot de passe doit contenir majuscule, minuscule, chiffre et symbole.";
  return null;
}
