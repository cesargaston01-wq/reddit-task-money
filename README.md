# Reddit Task Hub

Prompt Lovable – Marketplace de missions Reddit

Je souhaite créer une plateforme web moderne, minimaliste et très intuitive permettant à des utilisateurs de monétiser leur compte Reddit en réalisant des missions. L'objectif est de construire une véritable marketplace, mais dans un premier temps, les missions seront uniquement publiées par moi. La possibilité pour des entreprises de publier leurs propres missions sera ajoutée plus tard.

Design

Le design doit être :

Moderne, épuré et premium.

Inspiré de Linear, Stripe ou Vercel.

Très simple à utiliser avec une excellente UX.

Responsive (desktop et mobile).

Interface rapide avec peu d'éléments inutiles.

Landing Page

La page d'accueil doit expliquer clairement le concept :

Gagnez de l'argent avec votre compte Reddit en publiant des posts ou des commentaires sur des communautés pertinentes.

La landing page doit mettre en avant :

Le fonctionnement en 3 étapes.

Les critères pour être accepté.

Les gains possibles.

Une FAQ.

Une section de confiance expliquant que seuls des comptes Reddit de qualité sont acceptés.

En haut à droite, prévoir deux boutons :

Commencer à gagner de l'argent avec son compte

Poster une annonce

⚠️ Pour cette première version, le bouton Poster une annonce peut être masqué ou désactivé. Toute la plateforme fonctionne uniquement avec les missions que j'ajoute en tant qu'administrateur.

Authentification

Deux parcours :

1. Travailleur Reddit

Inscription classique.

Pendant l'inscription, demander :

Nom

Email

Mot de passe

Lien vers le profil Reddit

Adresse du wallet crypto

Une fois inscrit, son compte reste en attente de validation.

Vérification des comptes Reddit

Aucun utilisateur ne peut accéder aux missions tant que son compte Reddit n'a pas été validé.

Conditions obligatoires :

Minimum 3 mois d'ancienneté.

Minimum 100 de karma.

Avatar Reddit configuré.

Compte jugé de bonne qualité.

Prévoir un statut :

En attente

Accepté

Refusé

Dashboard utilisateur

Une fois accepté, l'utilisateur accède à un tableau de bord très simple.

Menu latéral :

Opportunités Posts

Opportunités Commentaires

Historique

Profil

Opportunités

Séparer les missions en deux catégories.

Opportunités Posts

Chaque mission affiche :

Nom de la mission

Communauté Reddit

Paiement (5 $)

Temps estimé

Difficulté

En cliquant dessus :

Afficher toutes les instructions :

Lien vers la communauté Reddit

Titre exact à utiliser

Body complet

Flair à sélectionner

Consignes particulières

En bas :

Champ de soumission :

"Lien vers votre publication Reddit"

Bouton :

Soumettre

Dès qu'une mission est soumise :

elle disparaît automatiquement de la liste des autres utilisateurs ;

elle passe en attente de validation.

Opportunités Commentaires

Même fonctionnement.

Afficher :

Lien vers le post Reddit concerné

Commentaire exact à publier

Paiement (3 $)

Champ :

"Lien vers votre commentaire"

Bouton :

Soumettre

Même logique de verrouillage automatique afin d'éviter que plusieurs personnes réalisent la même mission.

Validation

Lorsqu'une mission est soumise :

Statut :

En attente

Les administrateurs vérifient :

que le post/commentaire existe ;

qu'il respecte les consignes ;

qu'il reste publié pendant au moins 3 heures.

Une fois ce délai passé :

Statut :

Validé

Le paiement est alors effectué.

Les utilisateurs acceptent explicitement de ne pas supprimer leur publication après paiement.

Profil utilisateur

Afficher :

Wallet crypto

Profil Reddit

Nombre de missions réalisées

Total gagné

Missions en attente

Missions validées

Possibilité de modifier uniquement :

le wallet crypto.

Paiements

Tous les paiements sont réalisés en crypto.

Pour cette V1 :

aucun système de retrait automatique ;

le wallet est uniquement enregistré afin que je puisse payer manuellement.

Administration

Créer un back-office simple permettant de :

Ajouter une mission Post.

Ajouter une mission Commentaire.

Modifier une mission.

Supprimer une mission.

Voir toutes les soumissions.

Accepter ou refuser une soumission.

Valider les comptes Reddit.

Consulter tous les utilisateurs.

Voir le montant total à payer.

Règles métier importantes

Une mission ne peut être réalisée qu'une seule fois.

Dès qu'un utilisateur soumet une mission, celle-ci disparaît automatiquement pour tous les autres utilisateurs.

Les liens Reddit sont obligatoires lors de la soumission.

Les missions doivent rester publiées au minimum 3 heures avant validation.

Les utilisateurs acceptent de ne pas supprimer leurs publications après paiement.

Seuls les comptes Reddit validés peuvent accéder aux missions.

Business model (V1)

La plateforme fonctionne uniquement avec mes propres opportunités.

Tarification :

5 $ par post Reddit.

3 $ par commentaire Reddit.

Dans une future version, les entreprises pourront créer un compte, publier leurs propres missions et payer directement via la plateforme.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://reddit-task-money.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5b72e116-738f-4e52-9abc-1d0bf77410fa).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
