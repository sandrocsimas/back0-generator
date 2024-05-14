import { DMMF } from '@prisma/generator-helper';

import { GeneratorConfig, Resource } from '../../../../config/GeneratorConfig';
import { addEnumImportsFromFields, getTsFieldType } from '../../../../helpers/models';

export const generateCreateArgs = (generatorConfig: GeneratorConfig, model: DMMF.Model): Resource => {
  const args = generatorConfig.getServiceArgs(model, 'Create');
  const argsFields = model.fields.filter(
    (field) => !field.isId && !field.isGenerated && !field.relationName && !field.isUpdatedAt,
  );
  const argsFile = generatorConfig.project.createSourceFile(args.path);
  addEnumImportsFromFields(generatorConfig, argsFile, argsFields);
  argsFile.addInterface({
    isExported: true,
    name: args.name,
    properties: argsFields.map((field) => ({ name: field.name, type: getTsFieldType(field) })),
  });
  return args;
};
