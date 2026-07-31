## Objectif

Supprimer l'étape de confirmation par email : après inscription, l'utilisateur est connecté immédiatement et arrive directement sur les opportunités.

## Ce qui change

1. **Backend auth** — activer la confirmation automatique des comptes. Les emails de confirmation ne sont plus envoyés du tout, donc plus de problème de spam à l'inscription.

2. **Page d'inscription (`src/routes/auth.tsx`)**
   - Retirer l'encadré « Confirme ton adresse email » et le bouton « Resend confirmation email ».
   - Retirer la mention « You'll receive a confirmation email » sous le formulaire ; garder « ton compte reste en attente de validation manuelle » (la revue du profil Reddit par l'admin reste inchangée).
   - Après inscription réussie : redirection directe vers `/opportunities/posts`.

3. **Rien d'autre ne bouge** : la validation manuelle des comptes Reddit dans l'admin, le statut `pending/accepted`, et l'accès aux missions restent identiques.

## À savoir

- N'importe qui pourra s'inscrire avec une adresse email inexistante ou fausse. Ton filtre reste la validation manuelle du profil Reddit dans l'admin.
- La réinitialisation de mot de passe par email continuerait de passer par l'expéditeur partagé (donc risque de spam) tant que le domaine d'envoi `taskreddit.com` n'est pas configuré. Ça reste faisable plus tard.
- C'est réversible en une manip si tu veux réactiver la vérification.
