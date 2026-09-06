# Fiabiliser la création de compte

## Objectif
Éviter l’erreur réseau affichée sur certains navigateurs lors de l’inscription.

## Changements
- Faire transiter la création du compte par TaskReddit au lieu d’appeler directement le service d’authentification depuis le navigateur.
- Valider côté serveur l’email, le mot de passe et le profil Reddit, sans exposer d’informations sensibles.
- Conserver la confirmation obligatoire par email et les messages précis pour les mots de passe compromis, comptes existants et limites d’envoi.
- Tester une inscription réelle sur le site public avec un compte temporaire, puis supprimer ce compte.
