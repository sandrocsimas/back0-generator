import { DMMF } from '@prisma/generator-helper';
import { camelCase } from 'lodash';
import { SourceFile } from 'ts-morph';

import { GeneratorConfig } from '../config/GeneratorConfig';

import { getRelativeImportPath } from './paths';

const TS_FIELD_TYPES: Record<string, string> = {
  String: 'string',
  Int: 'number',
  Float: 'number',
  Boolean: 'boolean',
  DateTime: 'Date',
};

const GRAPHQL_FIELD_TYPES: Record<string, string> = {
  DateTime: 'GraphQLDateTime',
};

const GRAPHQL_SCALAR_MODULES: Record<string, string> = {
  GraphQLDateTime: 'graphql-scalars',
};

export const getThisPrismaCollection = (model: DMMF.Model): string => `this.prisma.${camelCase(model.name)}`;

export const getTsFieldType = (field: DMMF.Field): string => TS_FIELD_TYPES[field.type] ?? field.type;

export const getGqlFieldType = (field: DMMF.Field): string => GRAPHQL_FIELD_TYPES[field.type] ?? field.type;

export const isGqlScalarFieldType = (field: DMMF.Field): boolean => {
  const gqlFieldType = getGqlFieldType(field);
  return !!GRAPHQL_SCALAR_MODULES[gqlFieldType];
};

export const getPrimaryKeyFields = (model: DMMF.Model): DMMF.Field[] =>
  model.fields.filter((field) => field.isId || model.primaryKey?.fields.includes(field.name));

export const addEnumImportsFromFields = (
  generatorConfig: GeneratorConfig,
  sourceFile: SourceFile,
  fields: DMMF.Field[],
): void => {
  sourceFile.addImportDeclarations(
    [...new Set(fields.filter((field) => field.kind === 'enum').map((field) => field.type))].map((fieldType) => ({
      namedImports: [fieldType],
      moduleSpecifier: getRelativeImportPath(
        sourceFile.getDirectory().getPath(),
        generatorConfig.getEnum(fieldType).path,
      ),
    })),
  );
};

export const addGqlScalarImportsFromFields = (sourceFile: SourceFile, fields: DMMF.Field[]): void => {
  const namedImportsByModule: Record<string, string[]> = {};
  fields.forEach((field) => {
    const gqlType = getGqlFieldType(field);
    const scalarModule = GRAPHQL_SCALAR_MODULES[gqlType];
    if (scalarModule) {
      namedImportsByModule[scalarModule] = [...(namedImportsByModule[scalarModule] ?? []), gqlType];
    }
  });
  sourceFile.addImportDeclarations(
    Object.entries(namedImportsByModule).map(([module, namedImports]) => ({
      namedImports: [...new Set(namedImports)],
      moduleSpecifier: module,
    })),
  );
};
