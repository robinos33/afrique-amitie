# Afrique Amitié — notes projet

## Git
- Ne jamais ajouter de ligne `Co-Authored-By` dans les messages de commit.
- Auteur configuré : Robin <robin.aldasoro@gmail.com>

## Stack
- Générateur statique : Eleventy (11ty) v3
- Templates : Nunjucks (`.njk`)
- CSS : Tailwind CDN (config inline dans `base.njk`)
- Sources : `src/` → build : `_site/`

## Conventions
- Les partials sont dans `src/_includes/partials/`
- Les layouts dans `src/_includes/layouts/`
- Les assets statiques dans `src/assets/` (copiés tels quels dans `_site/assets/`)
- `preview.html` à la racine est un fichier de visualisation temporaire, ne pas committer
