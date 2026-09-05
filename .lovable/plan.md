# Vérification d'email à l'inscription

Oui, c'est faisable. Pas besoin de Resend : l'envoi d'emails est intégré à Lovable, il suffit de configurer taskreddit.com comme domaine expéditeur. Les emails partiront de quelque chose comme `noreply@notify.taskreddit.com`, avec le design TaskReddit (fond sombre non applicable — les emails restent sur fond blanc, avec l'accent orange).

## Ce qui change pour un nouvel inscrit

1. Il crée son compte avec email + mot de passe + profil Reddit.
2. Il reçoit immédiatement un email « Confirme ton adresse » avec un bouton.
3. Tant qu'il n'a pas cliqué, il voit un écran « Vérifie ta boîte mail » avec un bouton « Renvoyer l'email » (au lieu d'accéder aux missions).
4. Après le clic, il arrive sur les opportunités ; son compte reste ensuite en attente de validation manuelle comme aujourd'hui.

Rien ne change pour les comptes déjà inscrits : ils restent connectés et considérés comme vérifiés.

## Étapes

1. Configurer taskreddit.com comme domaine d'envoi (carte de configuration dans le chat, puis quelques enregistrements DNS chez ton hébergeur de domaine). L'activation se fait automatiquement une fois le DNS propagé.
2. Créer les modèles d'emails d'authentification aux couleurs de TaskReddit (confirmation d'inscription, réinitialisation de mot de passe, lien magique, invitation, changement d'email, ré-authentification) — logo, accent orange, ton en anglais comme le reste du site.
3. Réactiver la confirmation d'email obligatoire côté authentification (aujourd'hui la confirmation automatique est activée).
4. Ajouter l'écran d'attente de vérification après inscription, avec renvoi de l'email et message d'erreur clair si quelqu'un tente de se connecter sans avoir confirmé.

## Détails techniques

- `supabase--configure_auth` : passer `auto_confirm_email` à `false`. Vérifier `rate_limit_email_sent` une fois l'envoi actif.
- `email_domain--scaffold_auth_email_templates` pour générer les 6 modèles + la route webhook ; styliser d'après `src/styles.css` (accent `#FF4500`, Space Grotesk / DM Sans), fond `#ffffff` obligatoire.
- `src/routes/auth.tsx` : après `signUp`, si `data.session` est nul, afficher l'état « vérifie ta boîte mail » avec `supabase.auth.resend({ type: 'signup', email })` ; sur `signInWithPassword`, traiter `email_not_confirmed` avec un message dédié et le bouton de renvoi.
- Aucun changement de base de données : `handle_new_user` se déclenche déjà à la création du compte, et le statut `pending` reste la validation manuelle.

## Point d'attention

Les emails ne partiront réellement qu'une fois le DNS de taskreddit.com vérifié. Pour éviter de bloquer les inscriptions entre-temps, la confirmation obligatoire est activée en dernier, une fois l'envoi confirmé fonctionnel.
