# Vérification d'email à l'inscription (avec Resend)

Objectif : après l'inscription, l'utilisateur doit confirmer son adresse email avant d'accéder aux missions. Les emails sont envoyés via Resend, depuis taskreddit.com.

## Ce qui change pour un nouvel inscrit

1. Il crée son compte (email + mot de passe + profil Reddit).
2. Il reçoit un email TaskReddit « Confirm your email » avec un bouton.
3. Tant qu'il n'a pas cliqué, il voit un écran « Check your inbox » avec un bouton « Resend email ».
4. Après le clic, il arrive sur les opportunités ; son compte reste ensuite en attente de validation manuelle, comme aujourd'hui.

Les comptes existants ne sont pas impactés : ils restent connectés et considérés comme vérifiés.

## Étapes

1. **Connecter Resend** via la carte de connexion dans le chat (tu choisis ou crées la connexion avec ta clé Resend).
2. **Vérifier taskreddit.com dans Resend** (enregistrements DNS SPF/DKIM chez ton hébergeur DNS). Tant que ce n'est pas fait, Resend ne délivre qu'à l'adresse du propriétaire du compte.
3. **Créer l'email de confirmation** aux couleurs de TaskReddit : logo, accent orange #FF4500, texte en anglais, bouton « Confirm my email ».
4. **Brancher l'envoi** : à l'inscription, le backend génère le lien de confirmation officiel et l'envoie par Resend ; ajout d'un renvoi manuel limité (anti-spam).
5. **Activer la confirmation obligatoire** en dernier, une fois un email de test bien reçu.

## Détails techniques

- Connexion Resend via `standard_connectors--connect` (connector `resend`) ; appels par le gateway Lovable (`https://connector-gateway.lovable.dev/resend/emails`) avec `LOVABLE_API_KEY` + `RESEND_API_KEY`. Aucune clé en clair dans le code.
- `supabase--configure_auth` : `auto_confirm_email` → `false`.
- Nouveau `src/lib/auth-email.functions.ts` (`createServerFn`) :
  - handler public appelé après `signUp` et pour le renvoi ;
  - import dynamique de `@/integrations/supabase/client.server` dans le handler, puis `supabaseAdmin.auth.admin.generateLink({ type: 'signup', email, options: { redirectTo: 'https://reddit-task-money.lovable.app/auth' } })` ;
  - rendu HTML de l'email (template inline, fond blanc, accent orange) et POST vers le gateway Resend avec `from: 'TaskReddit <noreply@taskreddit.com>'` ;
  - garde anti-abus : ne rien envoyer si l'utilisateur est déjà confirmé, throttle par email (dernier envoi < 60 s → refus silencieux) ;
  - surface l'erreur du provider (status + body) en cas d'échec.
- `src/routes/auth.tsx` : après `signUp`, si `data.session` est nul → écran « Check your inbox » avec bouton « Resend email » ; sur `signInWithPassword`, gérer `email_not_confirmed` avec un message dédié + renvoi.
- Aucun changement de base de données : `handle_new_user` s'exécute déjà à la création du compte, et le statut `pending` reste la validation manuelle.

## Point d'attention

Avant que taskreddit.com soit vérifié dans Resend, les envois échoueront pour les autres destinataires. On active donc la confirmation obligatoire seulement après un test d'envoi réussi, pour ne pas bloquer les inscriptions entre-temps.
