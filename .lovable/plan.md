# Plan : migration vers le self-hosting avec Supabase

## Objectif
Héberger TaskReddit en dehors de Lovable Cloud, sur ton propre compte Supabase + une plateforme de déploiement (Vercel, Netlify, Cloudflare Pages, etc.).

## Avertissement
Déconnecter Lovable Cloud est **irréversible** et supprime la base, l’auth et le stockage actuels. On commence par exporter les données avant toute coupure.

## Étapes

### 1. Exporter les données de Lovable Cloud
- Aller dans **Cloud → Advanced settings → Export data** dans Lovable.
- Récupérer l’export complet (schema + données).
- Conserver une copie locale sécurisée.

### 2. Créer le nouveau projet Supabase
- Créer un projet dans ton compte Supabase.
- Noter l’URL et la clé publique (anon key).
- Configurer l’authentification (Google OAuth, email confirmation, etc.) selon les besoins actuels.

### 3. Migrer le schema et les données
- Appliquer le schema exporté dans le nouveau projet Supabase.
- Réappliquer manuellement les éléments non inclus dans l’export si nécessaire (politiques RLS, triggers, fonctions, grants).
- Importer les données des tables `profiles`, `missions`, `submissions`, `user_roles`, `admin_favorites`, etc.

### 4. Configurer les variables d’environnement
Le code utilise les variables suivantes :
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Dans le nouvel hébergeur, définir ces variables avec les valeurs du nouveau projet Supabase.

### 5. Adapter le code si nécessaire
- `src/integrations/supabase/client.ts` est auto-généré : ne pas le modifier, juste fournir les bonnes variables d’env.
- Vérifier `src/start.ts` et les middlewares d’authentification.
- Réinstaller les dépendances (`bun install`) et tester le build (`bun run build`).

### 6. Déployer
- Pousser le repo sur GitHub.
- Connecter le repo à Vercel/Netlify/Cloudflare Pages.
- Configurer les variables d’environnement dans l’interface de déploiement.
- Déployer et vérifier les routes publiques + authentifiées.

### 7. Couper Lovable Cloud (dernier)
- Une fois l’app déployée et testée, déconnecter Lovable Cloud depuis **Cloud → Advanced → Disconnect**.
- Mettre à jour le domaine personnalisé (`taskreddit.com`) pour pointer vers le nouvel hébergement.

## Questions en suspens
- Quelle plateforme de déploiement veux-tu utiliser ? (Vercel est la plus simple avec TanStack Start.)
- Veux-tu conserver le domaine `taskreddit.com` ?
- Veux-tu que je t’aide à exporter les tables clés en CSV dès maintenant, en parallèle de la préparation ?
