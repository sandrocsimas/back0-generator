import path from 'path';

import { Writers } from 'ts-morph';

import { GeneratorConfig, Resource } from '../../config/GeneratorConfig';
import { getRelativeImportPath } from '../../helpers/paths';

import { generateDomain } from './domain/domainGenerator';

const generateModule = (generatorConfig: GeneratorConfig, generatedDomains: Resource[]): void => {
  const moduleName = 'DomainsModule';
  const moduleFile = generatorConfig.project.createSourceFile(
    path.join(generatorConfig.domainsDir, `${moduleName}.ts`),
  );
  moduleFile.addImportDeclaration({
    namedImports: ['Module'],
    moduleSpecifier: '@nestjs/common',
  });
  generatedDomains.forEach((generatedDomain) => {
    moduleFile.addImportDeclaration({
      namedImports: [generatedDomain.name],
      moduleSpecifier: getRelativeImportPath(generatorConfig.domainsDir, generatedDomain.path),
    });
  });
  moduleFile.addClass({
    isExported: true,
    name: moduleName,
    decorators: [
      {
        name: 'Module',
        arguments: Writers.object({
          imports: `[${generatedDomains.map((generatedDomain) => generatedDomain.name).join(',')}]`,
        }),
      },
    ],
  });
};

export const generateDomains = (generatorConfig: GeneratorConfig): void => {
  const generatedDomains = generatorConfig.options.dmmf.datamodel.models.map((model) =>
    generateDomain(generatorConfig, model),
  );
  generateModule(generatorConfig, generatedDomains);
};
