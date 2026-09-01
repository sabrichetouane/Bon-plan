# Diagrammes — Bon Plan Bizerte

Trois fichiers PlantUML décrivent l'application :

| Fichier                    | Diagramme                       |
| -------------------------- | ------------------------------- |
| `1-mcd.puml`               | Modèle Conceptuel de Données    |
| `2-usecase.puml`           | Cas d'utilisation               |
| `3-class-diagram.puml`     | Diagramme de classes            |

## Comment générer les images

### Option 1 — Site officiel (le plus simple)

1. Va sur <https://www.plantuml.com/plantuml/uml>
2. Ouvre un fichier `.puml`, copie tout le contenu
3. Colle-le dans la zone de texte
4. Le diagramme apparaît à droite — clique droit pour l'enregistrer en PNG ou SVG

### Option 2 — Extension VS Code

1. Installe l'extension `PlantUML` (jebbs.plantuml)
2. Ouvre un fichier `.puml`
3. `Alt + D` pour la prévisualisation
4. `Ctrl + Shift + P` → `PlantUML: Export Current Diagram`

### Option 3 — Java en local

```bash
java -jar plantuml.jar 1-mcd.puml
```

Génère `1-mcd.png` à côté du fichier source.

## Modifier les diagrammes

Édite simplement le `.puml` correspondant — c'est du texte. Re-génère
ensuite avec une des options ci-dessus.
