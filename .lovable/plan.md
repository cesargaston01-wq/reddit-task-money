# Réparer définitivement la création de compte

## Constat vérifié

- Le serveur refuse actuellement certains mots de passe jugés trop faibles ou compromis.
- Un essai d’envoi Resend a aussi été refusé avec une adresse de test en `example.com`.
- L’écran masque encore certaines erreurs serveur derrière le message générique « We could not create your account ».

## Changements

1. **Rendre chaque échec compréhensible**
   - Afficher un message précis lorsqu’un mot de passe est refusé, y compris si le refus remonte comme une exception.
   - Distinguer clairement : adresse déjà utilisée, mot de passe refusé, création impossible et envoi Resend impossible.
   - Conserver un message neutre pour les actions sensibles comme le renvoi de confirmation et la récupération du mot de passe.

2. **Fiabiliser l’inscription et son nettoyage**
   - Vérifier l’existence du compte avant la création.
   - Supprimer uniquement un compte non confirmé laissé par un essai échoué.
   - Si Resend refuse l’envoi, annuler la création afin que la même adresse puisse réessayer immédiatement.
   - Ne jamais supprimer ni modifier un compte déjà confirmé.

3. **Valider Resend de bout en bout**
   - Tester avec une vraie adresse de réception, pas un domaine factice bloqué par Resend.
   - Vérifier que l’expéditeur est bien `noreply@taskreddit.com`.
   - Ouvrir le lien reçu, confirmer le compte, puis vérifier la connexion.
   - Tester aussi le renvoi de confirmation et le mot de passe oublié.

4. **Mettre en ligne et revalider**
   - Vérifier l’absence d’erreur de compilation et d’exécution.
   - Publier la version corrigée, car un changement visible uniquement dans l’aperçu ne répare pas le site public.
   - Refaire une inscription complète sur le site public après publication.

## Détail technique

- Les appels serveur retourneront une réponse structurée pour les erreurs attendues au lieu de laisser le navigateur tomber dans le message générique.
- Les erreurs inattendues resteront journalisées côté serveur sans exposer d’informations sensibles.
- Le lien de confirmation continuera d’être généré par le service d’authentification, puis envoyé exclusivement via la connexion Resend existante.
