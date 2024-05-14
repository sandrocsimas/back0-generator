import { DMMF } from '@prisma/generator-helper';

import { GeneratorConfig, Resource } from '../../../../../config/GeneratorConfig';
import { addEnumImportsFromFields, getPrimaryKeyFields, getTsFieldType } from '../../../../../helpers/models';

export const generateDeleteArgs = (generatorConfig: GeneratorConfig, model: DMMF.Model): Resource => {
  const args = generatorConfig.getServiceArgs(model, 'Delete');
  const argsFields = getPrimaryKeyFields(model);
  const argsFile = generatorConfig.project.createSourceFile(args.path);
  addEnumImportsFromFields(generatorConfig, argsFile, argsFields);
  argsFile.addInterface({
    isExported: true,
    name: args.name,
    properties: argsFields.map((field) => ({ name: field.name, type: getTsFieldType(field) })),
  });
  return args;
};
