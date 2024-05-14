import path from 'path';

import { DMMF } from '@prisma/generator-helper';
import { camelCase } from 'lodash';
import { Writers } from 'ts-morph';

import { GeneratorConfig, Resource } from '../../config/GeneratorConfig';
import { getRelativeImportPath } from '../../helpers/paths';

import { generateResolver } from './graphql/resolverGenerator';
import { generateService } from './services/serviceGenerator';

export interface GeneratedModule {
  path: string;
  name: string;
}

const generateModule = (
  generatorConfig: GeneratorConfig,
  model: DMMF.Model,
  service: Resource,
  resolver: Resource,
): Resource => {
  const domainDir = path.join(generatorConfig.domainsDir, camelCase(model.name));

  const moduleName = `${model.name}Module`;
  const moduleFile = generatorConfig.project.createSourceFile(path.join(domainDir, `${moduleName}.ts`));
  moduleFile.addImportDeclaration({
    namedImports: ['Module'],
    moduleSpecifier: '@nestjs/common',
  });
  moduleFile.addImportDeclaration({
    namedImports: [resolver.name],
    moduleSpecifier: getRelativeImportPath(domainDir, resolver.path),
  });
  moduleFile.addImportDeclaration({
    namedImports: [service.name],
    moduleSpecifier: getRelativeImportPath(domainDir, service.path),
  });
  moduleFile.addClass({
    isExported: true,
    name: moduleName,
    decorators: [
      {
        name: 'Module',
        arguments: [
          Writers.object({
            providers: `[${resolver.name}, ${service.name}]`,
          }),
        ],
      },
    ],
  });
  return { name: moduleName, dir: domainDir, path: moduleFile.getFilePath() };
};

export const generateDomain = (generatorConfig: GeneratorConfig, model: DMMF.Model): Resource => {
  const service = generateService(generatorConfig, model);
  const resolver = generateResolver(generatorConfig, model);

  return generateModule(generatorConfig, model, service, resolver);
};
