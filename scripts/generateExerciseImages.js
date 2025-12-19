#!/usr/bin/env node

/**
 * Generiert eine Datei mit require()-Abbildungen für numerisch benannte Exercise-Assets,
 * damit neue PNG-Dateien ohne manuelles Anpassen des Codes erkannt werden.
 */

const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const imagesDir = path.join(projectRoot, 'assets', 'images');
const outputFile = path.join(projectRoot, 'constants', 'generatedExerciseImages.ts');

if (!fs.existsSync(imagesDir)) {
  console.error(`Verzeichnis ${imagesDir} existiert nicht.`);
  process.exit(1);
}

const imageFiles = fs
  .readdirSync(imagesDir, { withFileTypes: true })
  .filter((entry) => entry.isFile() && /^\d+\.png$/.test(entry.name))
  .map((entry) => entry.name)
  .sort((a, b) => {
    const numA = parseInt(a.replace('.png', ''), 10);
    const numB = parseInt(b.replace('.png', ''), 10);
    return numA - numB;
  });

const lines = imageFiles.map(
  (fileName) => `  '${path.basename(fileName, '.png')}': require('../assets/images/${fileName}')`
);

const content = `// Diese Datei wird von scripts/generateExerciseImages.js erzeugt.\n` +
  `// Nach dem Hinzufügen neuer nummerierter Bilder bitte erneut \"npm run generate-exercise-images\" ausführen.\n\n` +
  `export const AUTO_EXERCISE_IMAGE_MAP: Record<string, number> = {\n${lines.join(',\n')}\n};\n`;

fs.writeFileSync(outputFile, content, 'utf8');
console.log(`✅ ${imageFiles.length} Einträge nach ${outputFile} geschrieben.`);

