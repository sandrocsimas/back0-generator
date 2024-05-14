import fs from 'fs/promises';

import { GeneratorOptions, generatorHandler } from '@prisma/generator-helper';

import { GeneratorConfig } from './config/GeneratorConfig';
import { generateCore } from './generators/coreGenerator';
import { generateDomains } from './generators/domainsGenerator';
import { generateEnums } from './generators/enumsGenerator';

generatorHandler({
  onManifest: () => ({
    defaultOutput: 'node_modules/@generated/back0',
    prettyName: 'Back0 Generator',
    requiresGenerators: ['prisma-client-js'],
  }),
  onGenerate: async (options: GeneratorOptions) => {
    await fs.writeFile('/Users/sandro/Desktop/options.json', JSON.stringify(options));

    const generatorConfig = new GeneratorConfig(options);
    await generatorConfig.mkdirs();

    await generateCore(generatorConfig);
    generateEnums(generatorConfig);
    generateDomains(generatorConfig);

    await generatorConfig.project.save();
  },
});
