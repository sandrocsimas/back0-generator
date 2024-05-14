import { DMMF } from '@prisma/generator-helper';
import { camelCase } from 'lodash';
import pluralize from 'pluralize';
import { Scope } from 'ts-morph';

import { GeneratorConfig, Resource } from '../../../../config/GeneratorConfig';
import { getPrimaryKeyFields, getTsFieldType } from '../../../../helpers/models';
import { getRelativeImportPath } from '../../../../helpers/paths';

import { generateObject } from './objectGenerator';

export const generateResolver = (generatorConfig: GeneratorConfig, model: DMMF.Model): Resource => {
  const service = generatorConfig.getService(model);
  const object = generateObject(generatorConfig, model);

  const serviceAttr = camelCase(service.name);
  const primaryKeyFields = getPrimaryKeyFields(model);

  const resolver = generatorConfig.getGraphQlResolver(model);
  const resolverFile = generatorConfig.project.createSourceFile(resolver.path);
  resolverFile.addImportDeclarations([
    { namedImports: ['Args', 'Mutation', 'Query', 'Resolver'], moduleSpecifier: '@nestjs/graphql' },
  ]);
  resolverFile.addImportDeclarations([
    { namedImports: [service.name], moduleSpecifier: getRelativeImportPath(resolver.dir, service.path) },
  ]);
  resolverFile.addImportDeclarations([
    { namedImports: [object.name], moduleSpecifier: getRelativeImportPath(resolver.dir, object.path) },
  ]);
  resolverFile.addClass({
    isExported: true,
    name: resolver.name,
    ctors: [
      {
        scope: Scope.Public,
        parameters: [{ name: serviceAttr, type: service.name, scope: Scope.Private, isReadonly: true }],
      },
    ],
    decorators: [{ name: 'Resolver', arguments: [`() => ${object.name}`] }],
    methods: [
      {
        scope: Scope.Public,
        isAsync: true,
        name: camelCase(pluralize(model.name)),
        returnType: `Promise<${object.name}[]>`,
        statements: [
          `return (await this.${serviceAttr}.list${pluralize(model.name)}()).map((model) => ${object.name}.fromModel(model));`,
        ],
      },
      {
        scope: Scope.Public,
        isAsync: true,
        name: camelCase(model.name),
        parameters: primaryKeyFields.map((field) => ({
          name: field.name,
          type: getTsFieldType(field),
          decorators: [{ name: 'Args', arguments: [`'${field.name}'`] }],
        })),
        returnType: `Promise<${object.name}>`,
        statements: [
          `return ${object.name}.fromModel(await this.${serviceAttr}.get${model.name}({ ${primaryKeyFields.map((field) => field.name).join(', ')} }));`,
        ],
      },
      {
        scope: Scope.Public,
        isAsync: true,
        name: `create${model.name}`,
        returnType: `Promise<${object.name}>`,
        statements: [`return ${object.name}.fromModel(await this.${serviceAttr}.create${model.name}());`],
      },
      {
        scope: Scope.Public,
        isAsync: true,
        name: `update${model.name}`,
        returnType: `Promise<${object.name}>`,
        statements: [`return ${object.name}.fromModel(await this.${serviceAttr}.update${model.name}());`],
      },
      {
        scope: Scope.Public,
        isAsync: true,
        name: `delete${model.name}`,
        parameters: primaryKeyFields.map((field) => ({
          name: field.name,
          type: getTsFieldType(field),
          decorators: [{ name: 'Args', arguments: [`'${field.name}'`] }],
        })),
        returnType: `Promise<boolean>`,
        statements: [
          `await this.${serviceAttr}.delete${model.name}({ ${primaryKeyFields.map((field) => field.name).join(', ')} });`,
          'return true',
        ],
      },
    ],
  });
  return resolver;
};
