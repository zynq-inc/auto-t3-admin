import { FieldSchema, ModelSchema } from "src/createAdminRouter";

export function normalizeQueryParam(queryParam: string | string[] | undefined) {
  return Array.isArray(queryParam) ? queryParam[0] : queryParam;
}

function getIDType(field: FieldSchema): "cuid" | "uuid" | "int" | undefined {
  if (field.default instanceof Object && !Array.isArray(field.default)) {
    if (field.default.name == "cuid") {
      return "cuid";
    } else if (
      field.default.name == "uuid" ||
      (field.default.name == "dbgenerated" &&
        field.default.args.includes("gen_random_uuid()"))
    ) {
      return "uuid";
    } else if (field.type == "Int") {
      return "int";
    }
  }
}

export function isForeignKeyIDField(
  field: FieldSchema,
  model: ModelSchema,
  modelMap: Record<string, ModelSchema>
) {
  const relation = model.fields.find((f) =>
    f.relationFromFields?.includes(field.name)
  );
  const idField =
    relation && modelMap[relation.type]?.fields.find((f) => f.isId);
  if (relation && idField) {
    const idType = getIDType(field);
    if (idType) {
      return { modelName: relation?.type, idType };
    }
  }
  return undefined;
}
