# Tous les emails via Resend

## Objectif
Faire partir les emails utilisés par TaskReddit via le compte Resend déjà connecté, avec l’expéditeur `TaskReddit <noreply@taskreddit.com>`, sans utiliser l’expéditeur d’authentification par défaut.

## Changements

### 1. Centraliser l’envoi Resend
- Créer un service serveur unique qui envoie les emails via la connexion Resend existante.
- Vérifier systématiquement les erreurs retournées par Resend et ne jamais exposer les clés au navigateur.
- Conserver les modèles TaskReddit en anglais, avec l’identité sombre premium et l’accent orange.

### 2. Remplacer les emails d’inscription
- Faire créer le compte et générer son lien de confirmation côté serveur, sans déclencher l’email automatique.
- Envoyer ce lien avec Resend depuis `noreply@taskreddit.com`.
- Garder le compte inutilisable tant que l’adresse n’est pas confirmée.
- Adapter “Resend confirmation email” pour générer et envoyer un nouveau lien via Resend.

### 3. Remplacer la récupération de mot de passe
- Générer le lien sécurisé de récupération côté serveur sans déclencher l’email automatique.
- Envoyer ce lien via Resend.
- Conserver l’écran existant permettant de choisir le nouveau mot de passe.

### 4. Sécuriser les points d’entrée publics
- Valider strictement les adresses, mots de passe et liens Reddit.
- Répondre avec des messages neutres pour ne pas révéler si une adresse possède déjà un compte.
- Conserver les limites d’envoi de la plateforme d’authentification et éviter les doubles envois.
- Retirer l’ancien webhook email devenu inutile afin qu’il ne puisse pas produire un second email.

### 5. Vérifier le parcours complet
- Vérifier inscription → email Resend → confirmation → connexion.
- Vérifier mot de passe oublié → email Resend → nouveau mot de passe.
- Confirmer dans Resend que le domaine autorise bien l’envoi ; son état actuel autorise l’envoi mais signale une configuration DNS partiellement échouée, à surveiller pour la délivrabilité.

## Résultat attendu
Les emails d’authentification déclenchés dans TaskReddit utilisent Resend et affichent `TaskReddit <noreply@taskreddit.com>` comme expéditeur. Aucun email correspondant ne part en parallèle depuis `no-reply@auth.lovable.cloud`.

## Périmètre
Cette modification couvre tous les emails actuellement déclenchés dans l’application : confirmation d’inscription, renvoi de confirmation et récupération de mot de passe. Les futurs emails (invitation, magic link ou changement d’adresse) devront appeler le même service Resend lorsqu’ils seront ajoutés à l’interface.
