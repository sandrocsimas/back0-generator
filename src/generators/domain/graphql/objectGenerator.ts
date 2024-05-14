import { DMMF } from '@prisma/generator-helper';
import { Scope } from 'ts-morph';

import { GeneratorConfig, Resource } from '../../../config/GeneratorConfig';
import {
  addEnumImportsFromFields,
  addGqlScalarImportsFromFields,
  getGqlFieldType,
  getTsFieldType,
  isGqlScalarFieldType,
} from '../../../helpers/models';

export const generateObject = (generatorConfig: GeneratorConfig, model: DMMF.Model): Resource => {
  const object = generatorConfig.getGraphQlObject(model);
  const objectFields = model.fields.filter((field) => !field.relationName);
  const objectFile = generatorConfig.project.createSourceFile(object.path);
  objectFile.addImportDeclarations([{ namedImports: ['Field', 'ObjectType'], moduleSpecifier: '@nestjs/graphql' }]);
  objectFile.addImportDeclarations([{ namedImports: [model.name], moduleSpecifier: '@prisma/client' }]);
  addGqlScalarImportsFromFields(objectFile, objectFields);
  addEnumImportsFromFields(generatorConfig, objectFile, objectFields);
  objectFile.addClass({
    isExported: true,
    name: object.name,
    decorators: [{ name: 'ObjectType', arguments: [`'${model.name}'`] }],
    properties: objectFields.map((field) => ({
      scope: Scope.Public,
      name: `${field.name}${field.isRequired ? '!' : '?'}`,
      type: `${getTsFieldType(field)}${!field.isRequired ? ' | null' : ''}`,
      decorators: [
        {
          name: 'Field',
          arguments: ((): string[] => {
            if (!field.isRequired) {
              return [`() => ${getGqlFieldType(field)}`, '{ nullable: true }'];
            }
            if (isGqlScalarFieldType(field) || field.kind === 'enum') {
              return [`() => ${getGqlFieldType(field)}`];
            }
            return [];
          })(),
        },
      ],
    })),
    methods: [
      {
        scope: Scope.Public,
        isStatic: true,
        name: 'fromModel',
        parameters: [{ name: 'model', type: model.name }],
        returnType: object.name,
        statements: [
          `const obj = new ${object.name}();`,
          ...objectFields.map((field) => {
            return `obj.${field.name} = ${
              field.kind === 'enum'
                ? `${field.type}[model.${field.name} as keyof typeof ${field.type}]`
                : `model.${field.name};`
            }`;
          }),
          'return obj;',
        ],
      },
    ],
  });
  return object;
};
