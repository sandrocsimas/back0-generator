import fs from 'fs/promises';
import path from 'path';

import { VariableDeclarationKind, Writers } from 'ts-morph';

import { GeneratorConfig } from '../../config/GeneratorConfig';

export const generateCore = async (generatorConfig: GeneratorConfig): Promise<void> => {
  const prismaDir = path.join(generatorConfig.coreDir, 'prisma');
  await fs.mkdir(prismaDir);

  const prismaProviderFile = generatorConfig.project.createSourceFile(path.join(prismaDir, 'prismaProvider.ts'));
  prismaProviderFile.addImportDeclarations([
    { namedImports: ['Provider'], moduleSpecifier: '@nestjs/common' },
    { namedImports: ['PrismaClient'], moduleSpecifier: '@prisma/client' },
  ]);
  prismaProviderFile.addVariableStatement({
    isExported: true,
    declarationKind: VariableDeclarationKind.Const,
    declarations: [
      {
        name: 'prismaProvider',
        type: 'Provider',
        initializer: Writers.object({
          provide: 'PrismaClient',
          useFactory: '() => new PrismaClient()',
        }),
      },
    ],
  });
};
