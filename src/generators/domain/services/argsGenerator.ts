import { DMMF } from '@prisma/generator-helper';

import { GeneratorConfig, Resource } from '../../../config/GeneratorConfig';

import { generateCreateArgs } from './args/createArgsGenerator';
import { generateDeleteArgs } from './args/deleteArgsGenerator';
import { generateGetArgs } from './args/getArgsGenerator';
import { generateUpdateArgs } from './args/updateArgsGenerator';

export const generateArgs = (generatorConfig: GeneratorConfig, model: DMMF.Model): Resource[] => {
  const getArgs = generateGetArgs(generatorConfig, model);
  const createArgs = generateCreateArgs(generatorConfig, model);
  const updateArgs = generateUpdateArgs(generatorConfig, model);
  const deleteArgs = generateDeleteArgs(generatorConfig, model);
  return [getArgs, updateArgs, createArgs, deleteArgs];
};
