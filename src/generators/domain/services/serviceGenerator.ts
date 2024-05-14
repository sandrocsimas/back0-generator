import { DMMF } from '@prisma/generator-helper';
import pluralize from 'pluralize';
import { Scope } from 'ts-morph';

import { GeneratorConfig, Resource } from '../../../config/GeneratorConfig';
import { getThisPrismaCollection } from '../../../helpers/models';
import { getRelativeImportPath } from '../../../helpers/paths';

import { generateArgs } from './argsGenerator';

const getWhereClause = (model: DMMF.Model): string => {
  if (model.primaryKey) {
    return `{ ${model.primaryKey.name ?? model.primaryKey.fields.join('_')}: { ${model.primaryKey.fields.map((field) => `${field}: args.${field}`).join(', ')} } }`;
  }
  const ids = model.fields.filter((field) => field.isId).map((field) => `${field.name}: args.${field.name}`);
  return `{ ${ids.join(', ')} }`;
};

export const generateService = (generatorConfig: GeneratorConfig, model: DMMF.Model): Resource => {
  const service = generatorConfig.getService(model);
  const serviceArgsList = generateArgs(generatorConfig, model);
  const serviceFile = generatorConfig.project.createSourceFile(service.path);
  serviceFile.addImportDeclarations([
    { namedImports: ['Injectable'], moduleSpecifier: '@nestjs/common' },
    { namedImports: ['PrismaClient', model.name], moduleSpecifier: '@prisma/client' },
    ...serviceArgsList.map((serviceArgs) => ({
      namedImports: [serviceArgs.name],
      moduleSpecifier: getRelativeImportPath(serviceFile.getDirectory().getPath(), serviceArgs.path),
    })),
  ]);
  serviceFile.addClass({
    isExported: true,
    name: service.name,
    ctors: [
      {
        scope: Scope.Public,
        parameters: [{ name: 'prisma', type: 'PrismaClient', scope: Scope.Private, isReadonly: true }],
      },
    ],
    decorators: [{ name: 'Injectable', arguments: [] }],
    methods: [
      {
        scope: Scope.Public,
        name: `list${pluralize(model.name)}`,
        returnType: `Promise<${model.name}[]>`,
        statements: [`return ${getThisPrismaCollection(model)}.findMany();`],
      },
      {
        scope: Scope.Public,
        name: `get${model.name}`,
        parameters: [{ name: 'args', type: `Get${model.name}Args` }],
        returnType: `Promise<${model.name}>`,
        statements: [
          `return ${getThisPrismaCollection(model)}.findUniqueOrThrow({ where: ${model.primaryKey ? getWhereClause(model) : 'args'} });`,
        ],
      },
      {
        scope: Scope.Public,
        name: `create${model.name}`,
        parameters: [{ name: 'args', type: `Create${model.name}Args` }],
        returnType: `Promise<${model.name}>`,
        statements: [`return ${getThisPrismaCollection(model)}.create({ data: args });`],
      },
      {
        scope: Scope.Public,
        name: `update${model.name}`,
        parameters: [{ name: 'args', type: `Update${model.name}Args` }],
        returnType: `Promise<${model.name}>`,
        statements: [
          `return ${getThisPrismaCollection(model)}.update({ where: ${getWhereClause(model)}, data: args });`,
        ],
      },
      {
        scope: Scope.Public,
        isAsync: true,
        name: `delete${model.name}`,
        parameters: [{ name: 'args', type: `Delete${model.name}Args` }],
        returnType: 'Promise<void>',
        statements: [
          `await ${getThisPrismaCollection(model)}.delete({ where: ${model.primaryKey ? getWhereClause(model) : 'args'} });`,
        ],
      },
    ],
  });
  return service;
};
