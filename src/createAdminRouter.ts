import { z } from "zod";

import type { DMMF } from "@prisma/client/runtime";
import { AnyRootConfig, ProcedureBuilder, unsetMarker } from "@trpc/server";

export type JSON =
  | string
  | number
  | boolean
  | null
  | JSON[]
  | { [key: string]: JSON };

type FieldDefaultScalar = string | number | boolean;

export type FieldSchema = {
  kind: "scalar" | "object" | "enum" | "unsupported";
  name: string;
  isRequired: boolean;
  isList: boolean;
  isUnique: boolean;
  isId: boolean;
  isReadOnly: boolean;
  isGenerated?: boolean;
  isUpdatedAt?: boolean;
  type:
    | "BigInt"
    | "Boolean"
    | "Bytes"
    | "DateTime"
    | "Decimal"
    | "Float"
    | "Int"
    | "JSON"
    | "String"
    | string;
  dbNames?: string[] | null;
  hasDefaultValue: boolean;
  relationFromFields?: string[];
  relationToFields?: any[];
  relationOnDelete?: string;
  relationName?: string;
  documentation?: string;
  default?:
    | {
        name: string;
        args: any[];
      }
    | FieldDefaultScalar
    | FieldDefaultScalar[];
};

export type ModelSchema = {
  name: string;
  dbName: string | null;
  fields: FieldSchema[];
  uniqueFields: string[][];
  uniqueIndexes: DMMF.uniqueIndex[];
  documentation?: string;
  primaryKey: DMMF.PrimaryKey | null;
};

export type EnumSchema = {
  name: string;
  dbName: string | null;
  values: { name: string; dbName: string | null }[];
};

// https://github.com/prisma/prisma/blob/ce6b54a9f77f966062f57870bd5f12d9941c9b88/packages/generator-helper/src/types.ts#L55
export type DBEngineType =
  | "mysql"
  | "mongodb"
  | "sqlite"
  | "postgresql"
  | "postgres" // yep
  | "sqlserver"
  | "cockroachdb";

export type FullSchema<MODEL_NAMES extends string = string> = {
  dbEngineType: DBEngineType;

  models: Record<MODEL_NAMES, ModelSchema>;
  enums: EnumSchema[];
};

const pagination = z
  .object({
    page: z.number().nonnegative().optional().default(0),
    perPage: z.number().nonnegative().optional().default(25),
  })
  .optional()
  .default({ page: 0, perPage: 25 });

type PrismaInstance<UNCAP_MODEL_NAMES_UNION extends string> = {
  [Name in UNCAP_MODEL_NAMES_UNION]: {
    findMany: (...args: any[]) => Promise<any>;
    count: (...args: any[]) => Promise<number>;
    updateMany: (...args: any[]) => Promise<any>;
    create: (...args: any[]) => Promise<any>;
    deleteMany: (...args: any[]) => Promise<any>;
  };
};

// We need to reduce the values to plain JSON so that
// supertype doesn't do anything in case someone uses it
function serializeRoundtrip(v: unknown) {
  return JSON.parse(JSON.stringify(v));
}

export async function createAdminRouter<
  const MODEL_NAMES_UNION extends string,
  TConfig extends AnyRootConfig = AnyRootConfig
>(
  adminProcedure: ProcedureBuilder<{
    _config: TConfig;
    _ctx_out: TConfig["$types"]["ctx"];
    _input_in: typeof unsetMarker;
    _input_out: typeof unsetMarker;
    _output_in: typeof unsetMarker;
    _output_out: typeof unsetMarker;
    _meta: TConfig["$types"]["meta"];
  }>,
  ModelNames: { [k in MODEL_NAMES_UNION]: k },
  DB: PrismaInstance<Uncapitalize<MODEL_NAMES_UNION>>
) {
  const DMMF = await (DB as any)._getDmmf();
  const SCHEMA: FullSchema<string> = serializeRoundtrip({
    dbEngineType: (DB as any)._engineConfig.activeProvider,
    models: DMMF.modelMap,
    enums: DMMF.datamodel.enums,
  });

  function uncapitalizeTable(name: string) {
    const uncapitalizedTableName = (name[0]?.toLowerCase() +
      name.slice(1)) as Uncapitalize<MODEL_NAMES_UNION>;
    if (!(uncapitalizedTableName in DB)) {
      throw new Error(`Resource ${name} not found`);
    }
    return uncapitalizedTableName;
  }

  return {
    getSchema: adminProcedure.query(() => {
      return SCHEMA;
    }),
    getResource: adminProcedure
      .input(
        z.object({
          table: z.string(),
          includes: z.record(z.string(), z.unknown()).optional(),
          orderBy: z
            .array(z.record(z.string(), z.literal("asc").or(z.literal("desc"))))
            .optional(),
          where: z.record(z.string(), z.unknown()).optional(),
          pagination: pagination,
        })
      )
      .query(async (req) => {
        const [results, count] = await Promise.all([
          DB[uncapitalizeTable(req.input.table)]!.findMany({
            where: req.input.where,
            includes: req.input.includes,
            orderBy: req.input.orderBy,
            skip: req.input.pagination.page * req.input.pagination.perPage,
            take: req.input.pagination.perPage,
          }),
          DB[uncapitalizeTable(req.input.table)].count({
            where: req.input.where,
          }),
        ]);
        return {
          results: serializeRoundtrip(results) as {
            id: string;
            [k: string]: JSON;
          }[],
          numPages: Math.ceil(count / req.input.pagination.perPage),
        };
      }),
    updateResource: adminProcedure
      .input(
        z.object({
          table: z.string(),
          where: z.record(z.string(), z.unknown()).optional(),
          data: z.record(z.string(), z.unknown()).optional(),
        })
      )
      .mutation(async (req) => {
        return DB[uncapitalizeTable(req.input.table)].updateMany({
          where: req.input.where,
          data: req.input.data,
        }) as Promise<{ count: number }>;
      }),
    createResource: adminProcedure
      .input(
        z.object({
          table: z.string(),
          data: z.record(z.string(), z.any()).optional(),
        })
      )
      .mutation(async (req) => {
        const result = (await DB[uncapitalizeTable(req.input.table)].create({
          data: req.input.data,
        })) as Promise<{ [k: string]: unknown; id: string }>;
        return serializeRoundtrip(result);
      }),
    deleteResource: adminProcedure
      .input(
        z.object({
          table: z.string(),
          where: z.record(z.string(), z.unknown()).optional(),
        })
      )
      .mutation(async (req) => {
        return DB[uncapitalizeTable(req.input.table)].deleteMany({
          where: req.input.where,
        }) as Promise<{ count: number }>;
      }),
  };
}
