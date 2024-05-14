import fs from 'fs/promises';
import path from 'path';

import { DMMF, GeneratorOptions } from '@prisma/generator-helper';
import { camelCase } from 'lodash';
import { IndentationText, ModuleKind, Project, QuoteKind, ScriptTarget } from 'ts-morph';

export interface Resource {
  name: string;
  dir: string;
  path: string;
}

interface Paths {
  enums: Record<string, Resource>;
  services: Record<string, Resource>;
  servicesArgs: Record<string, Record<string, Resource>>;
  graphQlResolvers: Record<string, Resource>;
  graphQlObjects: Record<string, Resource>;
}

export class GeneratorConfig {
  public readonly project: Project;

  public readonly options: GeneratorOptions;

  public readonly outDir: string;

  public readonly coreDir: string;

  public readonly domainsDir: string;

  public readonly enumsDir: string;

  public readonly resources: Paths;

  public constructor(options: GeneratorOptions) {
    this.project = new Project({
      compilerOptions: {
        emitDecoratorMetadata: true,
        esModuleInterop: true,
        experimentalDecorators: true,
        module: ModuleKind.CommonJS,
        skipLibCheck: true,
        target: ScriptTarget.ESNext,
      },
      manipulationSettings: {
        indentationText: IndentationText.TwoSpaces,
        quoteKind: QuoteKind.Single,
        insertSpaceAfterOpeningAndBeforeClosingNonemptyBraces: true,
        useTrailingCommas: true,
      },
    });
    this.options = options;

    this.outDir = options.generator.output?.value ?? '';
    this.coreDir = path.join(this.outDir, 'core');
    this.domainsDir = path.join(this.outDir, 'domains');
    this.enumsDir = path.join(this.outDir, 'enums');

    this.resources = {
      enums: {},
      services: {},
      servicesArgs: {},
      graphQlResolvers: {},
      graphQlObjects: {},
    };

    options.dmmf.datamodel.enums.forEach((enumeration) => {
      this.resources.enums[enumeration.name] = {
        name: enumeration.name,
        dir: this.enumsDir,
        path: path.join(this.enumsDir, `${enumeration.name}.ts`),
      };
    });

    options.dmmf.datamodel.models.forEach((model) => {
      const domainDir = path.join(this.domainsDir, camelCase(model.name));

      const serviceName = `${model.name}Service`;
      const serviceDir = path.join(domainDir, 'services');
      this.resources.services[model.name] = {
        name: serviceName,
        dir: serviceDir,
        path: path.join(serviceDir, `${serviceName}.ts`),
      };

      this.resources.servicesArgs[model.name] = {};
      const argsPrefixes = ['Get', 'Create', 'Update', 'Delete'];
      argsPrefixes.forEach((argsPrefix) => {
        const serviceArgsName = `${argsPrefix}${model.name}Args`;
        const serviceArgsDir = path.join(serviceDir, 'args');
        this.getOrThrow(this.resources.servicesArgs[model.name])[argsPrefix] = {
          name: serviceArgsName,
          dir: serviceArgsDir,
          path: path.join(serviceArgsDir, `${serviceArgsName}.ts`),
        };
      });

      const resolverName = `${model.name}Resolver`;
      const resolverDir = path.join(domainDir, 'graphql');
      this.resources.graphQlResolvers[model.name] = {
        name: resolverName,
        dir: resolverDir,
        path: path.join(resolverDir, `${resolverName}.ts`),
      };

      const objectName = `${model.name}Object`;
      const objectDir = path.join(resolverDir, 'objects');
      this.resources.graphQlObjects[model.name] = {
        name: objectName,
        dir: objectDir,
        path: path.join(objectDir, `${objectName}.ts`),
      };
    });
  }

  public getEnum(enumName: string): Resource {
    return this.getOrThrow(this.resources.enums[enumName]);
  }

  public getService(model: DMMF.Model): Resource {
    return this.getOrThrow(this.resources.services[model.name]);
  }

  public getServiceArgs(model: DMMF.Model, argsPrefix: string): Resource {
    return this.getOrThrow(this.getOrThrow(this.resources.servicesArgs[model.name])[argsPrefix]);
  }

  public getGraphQlResolver(model: DMMF.Model): Resource {
    return this.getOrThrow(this.resources.graphQlResolvers[model.name]);
  }

  public getGraphQlObject(model: DMMF.Model): Resource {
    return this.getOrThrow(this.resources.graphQlObjects[model.name]);
  }

  public async mkdirs(): Promise<void> {
    await fs.rm(this.outDir, { recursive: true, force: true });
    await fs.mkdir(this.outDir, { recursive: true });

    await fs.mkdir(this.coreDir, { recursive: true });

    const enumsDirs = [...new Set(Object.values(this.resources.enums).map((resource) => resource.dir))];
    await Promise.all(enumsDirs.map((enumDir) => fs.mkdir(enumDir, { recursive: true })));

    const servicesDirs = [...new Set(Object.values(this.resources.services).map((resource) => resource.dir))];
    await Promise.all(servicesDirs.map((serviceDir) => fs.mkdir(serviceDir, { recursive: true })));

    const servicesArgsDirs = [
      ...new Set(
        Object.values(this.resources.servicesArgs)
          .map((serviceArgsByPrefix) => Object.values(serviceArgsByPrefix).map((resource) => resource.dir))
          .flat(),
      ),
    ];
    await Promise.all(servicesArgsDirs.map((serviceArgsDir) => fs.mkdir(serviceArgsDir, { recursive: true })));

    const resolversDirs = [...new Set(Object.values(this.resources.graphQlResolvers).map((resource) => resource.dir))];
    await Promise.all(resolversDirs.map((resolverDir) => fs.mkdir(resolverDir, { recursive: true })));

    const objectsDirs = [...new Set(Object.values(this.resources.graphQlObjects).map((resource) => resource.dir))];
    await Promise.all(objectsDirs.map((objectDir) => fs.mkdir(objectDir, { recursive: true })));
  }

  private getOrThrow<T>(value?: T): T {
    if (!value) {
      throw new Error('Value is undefined');
    }
    return value;
  }
}
