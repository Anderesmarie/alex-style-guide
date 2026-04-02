## Plan

1. **Migration** : Ajouter colonne `pseudo TEXT` à la table `profiles`
2. **Onboarding** : Nouvelle étape 0 "Comment on t'appelle ?" (pseudo, max 20 chars), décaler les étapes suivantes
3. **Today** : Charger le pseudo depuis Supabase, afficher greeting dynamique selon l'heure (Bonjour/Coucou/Bonsoir + pseudo), subGreeting en italique rose gold, date en gris
4. **Profile** : Ajouter champ "Mon pseudo" éditable avec bouton ✏️ et sauvegarde Supabase
