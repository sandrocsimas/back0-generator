import { GeneratorConfig } from '../config/GeneratorConfig';

export const generateEnums = (generatorConfig: GeneratorConfig): void => {
  generatorConfig.options.dmmf.datamodel.enums.forEach((enumeration) => {
    const enumFile = generatorConfig.project.createSourceFile(generatorConfig.getEnum(enumeration.name).path);
    enumFile.addEnum({
      isExported: true,
      name: enumeration.name,
      members: enumeration.values.map((value) => ({ name: value.name, value: value.name })),
    });
  });
};
