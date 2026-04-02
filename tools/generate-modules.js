'use strict';
/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║ WebArsenal v5.5.0 "Pulse" - Advanced Security Suite                          ║
 * ║ De{c0}ded by Edwin Dev                                                      ║
 * ║ Module: generate-modules.js                                                          ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */




const fs = require('fs');
const path = require('path');
const {
  CATEGORY_LABELS,
  getAllModules,
  getModuleCount,
  getModulesByCategory,
} = require('../lib/module-catalog');

const ROOT_DIR = path.resolve(__dirname, '..');

function wrapperTemplate(moduleId) {
  return `#!/usr/bin/env node
'use strict';

const { getModuleById } = require('../lib/module-catalog');
const { runModuleCli } = require('../lib/module-runner');

const definition = getModuleById('${moduleId}');

async function run(argv = process.argv) {
  return runModuleCli(definition, argv);
}

if (require.main === module) {
  run().catch((error) => {
    process.stderr.write(\`\${error.stack || error.message}\\n\`);
    process.exitCode = 1;
  });
}

module.exports = {
  definition,
  run,
};
`;
}

function buildCatalogMarkdown() {
  const lines = [
    '# Module Catalog',
    '',
    `WebArsenal currently ships ${getModuleCount()} scripts across 8 categories.`,
    '',
  ];

  for (const category of Object.keys(CATEGORY_LABELS)) {
    const modules = getModulesByCategory(category);
    lines.push(`## ${CATEGORY_LABELS[category]} (${modules.length})`);
    lines.push('');
    for (const moduleDefinition of modules) {
      lines.push(`- \`${moduleDefinition.filePath}\` - ${moduleDefinition.description}`);
    }
    lines.push('');
  }

  return `${lines.join('\n')}\n`;
}

function main() {
  const generatedModules = getAllModules().filter((moduleDefinition) => moduleDefinition.runtime === 'shared');

  for (const moduleDefinition of generatedModules) {
    const filePath = path.join(ROOT_DIR, moduleDefinition.filePath);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, wrapperTemplate(moduleDefinition.id), 'utf8');
  }

  fs.writeFileSync(path.join(ROOT_DIR, 'MODULES.md'), buildCatalogMarkdown(), 'utf8');
  process.stdout.write(`Generated ${generatedModules.length} shared module wrappers and updated MODULES.md.\n`);
}

if (require.main === module) {
  main();
}
