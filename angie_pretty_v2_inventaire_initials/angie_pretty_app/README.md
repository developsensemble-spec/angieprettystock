# ANGIE PRETTY — Gestion générale des ventes

**Version : 3.0.1.01**

Application web responsive de base pour centraliser ventes, clients, facturation, stock, dispatching Tana/Province, feedback, rapports et utilisateurs.

## Inclus dans cette version de départ

- Next.js + TypeScript
- PostgreSQL et Prisma
- Connexion avec cookie HTTP-only signé et mot de passe haché avec bcrypt
- Rôles : administrateur, gestionnaire général, commercial, facturier, magasinier, dispatching Tana/Province, feedback Tana/Province
- Catalogue et variantes par modèle, taille et couleur
- Commandes et réservation du stock disponible
- Factures, enregistrement de paiements
- Colis et mise à jour du suivi
- Assemblage des colis sortis du magasin, regroupement proposé par lieu et axe modifiable
- Fiches de livraison A4 paysage multi-pages avec impression/PDF et historique conservé
- Sortie physique de stock enregistrée au magasin une seule fois ; le dispatch et la réimpression ne déduisent pas le stock
- Feedbacks, clients, rapports de gestion
- Journal d'activité pour plusieurs opérations

## Important — périmètre de livraison

Ce dépôt est un **socle fonctionnel de départ**, pas encore une version certifiée pour la production. La création de commande gère actuellement une ligne de produit par commande. Avant d'utiliser des données réelles, faire une revue technique et des tests : contrôle d'accès complet par page/action, gestion des retours et annulations de stock, concurrence des numéros de commande, génération de PDF de facture, récupération de mot de passe, journalisation complète, sauvegardes et conformité des factures aux règles locales. Le code doit être revu par un développeur avant mise en production.

## Prérequis

- Node.js 20 ou supérieur
- npm
- PostgreSQL 15 ou supérieur
- Un serveur avec HTTPS pour la production

## Installation locale

1. Décompresser l'archive et ouvrir un terminal dans le dossier.
2. Installer les dépendances :

   ```bash
   npm install
   ```

3. Créer une base et un utilisateur PostgreSQL. Exemple (à exécuter dans psql comme administrateur PostgreSQL) :

   ```sql
   CREATE USER angie WITH PASSWORD 'remplacer-par-un-mot-de-passe-fort';
   CREATE DATABASE angie_pretty OWNER angie;
   ```

4. Copier `.env.example` vers `.env` et modifier toutes les valeurs :

   ```bash
   cp .env.example .env
   ```

   Sur Windows PowerShell :

   ```powershell
   Copy-Item .env.example .env
   ```

   Définir `DATABASE_URL`, `SESSION_SECRET` (au moins 32 caractères aléatoires), `SEED_ADMIN_EMAIL` et `SEED_ADMIN_PASSWORD`.

5. Générer le client et synchroniser le schéma, puis insérer un compte administrateur de départ :

   ```bash
   npx prisma generate
   npx prisma db push
   npm run db:seed
   ```

6. Démarrer :

   ```bash
   npm run dev
   ```

7. Ouvrir `http://localhost:3000`. Connectez-vous avec les identifiants que vous avez définis dans `.env`. Changez immédiatement le mot de passe initial selon votre politique de sécurité.

## Déploiement Internet

Architecture conseillée :
- Hébergement applicatif Node.js compatible Next.js
- PostgreSQL managé ou serveur PostgreSQL sécurisé
- Nom de domaine propre à la société
- HTTPS obligatoire
- Variables d'environnement configurées dans le panneau d'hébergement, jamais commitées dans Git
- Sauvegardes automatiques de PostgreSQL et procédure de restauration testée
- Journalisation et supervision de disponibilité

Procédure générale :
1. Créer une base PostgreSQL de production.
2. Définir les variables d'environnement sur l'hébergeur.
3. Installer les dépendances et lancer `npx prisma generate`.
4. Pour les migrations de production, créer des migrations contrôlées avec `npx prisma migrate dev --name init` en environnement de développement, puis exécuter `npx prisma migrate deploy` en production. Ne pas utiliser `db push` pour gérer les migrations d'une production établie.
5. Construire avec `npm run build`, puis démarrer avec `npm start`.
6. Vérifier connexion, permissions, création de commande, facturation, mouvements de stock et sauvegardes avant ouverture aux équipes.

## Comptes et rôles

Créer les comptes individuels dans Administration. Répartition initiale recommandée :
- 12 commerciaux
- 2 à 3 facturiers
- 2 magasiniers
- dispatching Tana et Province
- feedback Tana et Province
- gestionnaire général et administrateur

## Devise

Les montants sont saisis en Ariary (Ar). Vérifier les mentions et obligations de facturation applicables à Madagascar avec votre comptable.

## Sécurité avant production

- Remplacer tous les secrets de démonstration.
- Ne jamais utiliser un compte partagé.
- Activer HTTPS.
- Restreindre l'accès réseau à PostgreSQL.
- Tester les sauvegardes et restaurations.
- Faire auditer les autorisations et les règles de stock.
- Ajouter une procédure sécurisée de réinitialisation des mots de passe.
- Ajouter des tests automatisés et des protections contre les modifications concurrentes.
\n## Entrée de stock multicolore\n\nDans le menu **Entrée stock / Inventaire initial**, ajoutez chaque couleur avec le bouton « Ajouter couleur », sélectionnez les tailles, puis renseignez les quantités dans la matrice couleur/taille. Une seule soumission enregistre les variantes et leurs mouvements de stock dans une transaction. Pour un article existant, réutilisez exactement la même référence article (SKU) afin d’ajouter les quantités aux variantes correspondantes.\n

## Dernières évolutions

- Les commandes permettent maintenant de réserver plusieurs variantes/articles dans une même commande. Le champ Ville a été retiré du formulaire de commande; la destination Tana/Province reste disponible pour le circuit logistique.
- L’entrée de stock/inventaire initial comporte les champs prix d’achat et prix de vente unitaires. Le schéma Prisma ajoute `Variant.purchasePrice` avec une valeur par défaut de 0.
- La facturation comprend un aperçu avant impression au format ticket thermique 80 mm et un QR code de référence contenant le numéro de facture, commande, client et montants.

### Mise à jour de la base existante

Avant la mise à jour, sauvegardez la base PostgreSQL. Après avoir conservé votre fichier `.env` et installé les dépendances (`npm install`), appliquez le nouveau champ avec `npx prisma db push`, puis régénérez le client avec `npx prisma generate`. `db push` synchronise le schéma et ne remplace pas votre base par une base vide. Vérifiez toutefois le diff proposé par Prisma avant de confirmer.


## Notes de la version 3.0.1.01

- Le magasin enregistre la sortie physique en passant le colis au statut **Prêt / sorti du magasin**. Cette opération débite le stock final et la quantité réservée une seule fois.
- Le dispatch ne débite aucun stock. Les colis déjà expédiés ne sont pas proposés pour une nouvelle fiche.
- Les fiches d'assemblage sont enregistrées en base et accessibles depuis **Dispatching → Historique des fiches**. Ouvrir une fiche puis choisir **Imprimer / PDF** ; le format d'impression est A4 paysage avec en-tête de tableau répété et lignes conservées ensemble autant que le navigateur le permet.
- Après mise à jour, exécuter `npm install`, puis `npm run db:generate` et `npm run db:push`. Faire une sauvegarde de la base avant d'appliquer le nouveau schéma sur une base existante.
- L'installation et la compilation automatisées n'ont pas pu être vérifiées dans l'environnement de génération ; valider le build et le workflow sur une copie de la base avant la mise en production.


## Correctif de déploiement V3.0.1.02 — erreur `column "colonne" does not exist`

Cette erreur indique que le client Prisma et la structure de la base utilisée par `DATABASE_URL` ne correspondent pas. Elle ne se corrige pas en renommant au hasard un champ dans `schema.prisma`.

### Procédure Windows (conserver les données)
1. Arrêter le serveur Next.js (`Ctrl+C`).
2. Extraire cette archive dans un **nouveau dossier** et travailler depuis le dossier `angie_pretty_app` de cette archive. Ne pas copier uniquement `page.tsx` dans l'ancien projet.
3. Conserver le `.env` existant uniquement après avoir vérifié qu'il pointe vers la bonne base PostgreSQL. Ne jamais publier son contenu.
4. Faire une sauvegarde de la base avant toute modification. Exemple si `pg_dump` est installé : `pg_dump -h localhost -U VOTRE_UTILISATEUR -d VOTRE_BASE -F c -f angie_pretty_backup.dump`. Adapter hôte, utilisateur et base à votre configuration.
5. Dans CMD, exécuter `npm install`, puis `npx prisma validate`, puis `npx prisma generate`.
6. Ensuite exécuter `npx prisma db push` **uniquement après avoir vérifié le diff affiché et confirmé qu'il ne supprime ni ne réinitialise les données utiles**. Si Prisma propose une suppression de données ou un changement destructif, répondre non et demander une migration contrôlée.
7. Relancer `npm run dev`.

Ne pas exécuter `migrate reset`, ne pas supprimer les tables, et ne pas remplacer `schema.prisma` par la sortie de `db pull --print` : cette dernière décrit la base ancienne et pourrait faire perdre les modèles de la V3.


## Version 3.0.2.00 — interface responsive et PWA

Cette version ajoute les éléments de base d’une application web installable (PWA) tout en conservant l’application Next.js et les règles métier existantes.

- Interface adaptative pour téléphone Android, tablette, macOS et Windows.
- Manifeste web, icônes 192/512 px et couleur de thème.
- Enregistrement du service worker pour les ressources statiques de l’application. Les commandes, stocks, factures et autres données métier restent connectés au serveur : cette version ne prétend pas permettre la saisie métier hors ligne.
- La PWA doit être servie en HTTPS en production. `localhost` fonctionne en développement.

### Installer sur Android

1. Déployer l’application sur un serveur accessible en HTTPS et configurer `DATABASE_URL` et `SESSION_SECRET` côté serveur.
2. Ouvrir l’adresse de l’application dans Chrome sur Android et se connecter.
3. Ouvrir le menu ⋮ du navigateur, puis choisir **Installer l’application** ou **Ajouter à l’écran d’accueil**.

### Utiliser sur iPhone/iPad ou macOS

Dans Safari, ouvrir l’application en HTTPS. Sur iPhone/iPad, utiliser **Partager → Sur l’écran d’accueil**. Sur macOS, selon la version de Safari, utiliser **Fichier → Ajouter au Dock**.

### Windows

Ouvrir l’application dans Edge ou Chrome, puis utiliser l’icône d’installation dans la barre d’adresse ou le menu du navigateur.

### Développement local

```cmd
npm install
npx prisma generate
npm run dev
```

Puis ouvrir `http://localhost:3000`. Pour tester l’installation sur un téléphone, il faut déployer sur HTTPS ou utiliser un environnement de test HTTPS accessible au téléphone.

**Données et workflow :** aucune migration de base de données n’est requise pour activer la PWA. Sauvegarder la base avant toute autre mise à jour de schéma. La sortie du magasin, la facturation et l’historique conservent leurs règles métier existantes.

## Version 3.0.3 — Feedback de livraison et menu Caissier

- Le menu **Équipe feedback** liste les colis assemblés par le dispatching, avec les articles, le client, la fiche et le livreur.
- Chaque fiche peut être marquée **VENDU**, **RETOUR** ou **À LIVRER**. Les rôles Feedback Tana et Feedback Province restent limités à leur circuit.
- Le nouveau menu **Caissier** (rôles Administrateur, Gestionnaire et Facturier) montre uniquement les fiches marquées **VENDU**, regroupées par livreur.
- Les données restent dans PostgreSQL via Prisma ; les statuts sont persistés en base, pas uniquement dans le navigateur.

### Mise à jour de la base existante

1. Faire une sauvegarde de la base Supabase/PostgreSQL.
2. Régénérer Prisma : `npx prisma generate`.
3. Appliquer la migration SQL `prisma/migrations/202610160001_dispatch_feedback/migration.sql` dans le SQL Editor Supabase, ou appliquer le changement du schéma avec une procédure Prisma contrôlée. Ne pas exécuter les deux méthodes.
4. Vérifier dans `DispatchSheetItem` que `feedbackStatus` existe et vaut `TO_DELIVER` pour les anciennes fiches.

### Supabase

Configurer `DATABASE_URL` côté serveur avec l'URL PostgreSQL du projet Supabase. Utiliser l'URL adaptée au runtime et au mode de connexion Supabase (pooler recommandé pour les connexions applicatives serverless). Garder `SESSION_SECRET` côté serveur. Ne jamais exposer les secrets dans les variables `NEXT_PUBLIC_*` ni publier le fichier `.env`.

### Cloudflare

Cette archive contient le code métier, mais **le déploiement Cloudflare n'est pas certifié par un build dans cet environnement**. Le projet utilise Next.js Server Actions et Prisma avec le moteur PostgreSQL standard ; avant la mise en production sur Cloudflare Workers, il faut valider le runtime Next.js/OpenNext et la compatibilité du client Prisma avec le runtime choisi. Ne pas considérer un simple build Cloudflare comme preuve que l'accès Supabase et les actions serveur fonctionnent. Tester la connexion, la connexion utilisateur, les changements de statut et le menu Caissier sur un environnement de préproduction avant de basculer les utilisateurs.
