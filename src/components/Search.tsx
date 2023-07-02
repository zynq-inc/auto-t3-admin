import { ChangeEvent, useCallback } from "react";

import { EnumSchema, FieldSchema, ModelSchema } from "../createAdminRouter";
import styles from "./Search.module.css";
import { useAutoAdminContext } from "./AutoAdminContext";

const isInt = new RegExp(/^-?\d*$/);
const isFloat = new RegExp(/^-?\d*\.?\d*$/);
const isUUIDV4 = new RegExp(
  /(^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12})|(^[0-9A-F]{12}?4[0-9A-F]{3}[89AB][0-9A-F]{15})$/i
);

function getTypedWhereValue(
  query: string,
  field: FieldSchema,
  enums: EnumSchema[]
) {
  if (field.type == "String" && field.name.toUpperCase().endsWith("ID")) {
    if (query.match(isUUIDV4)) {
      return [query];
    } else {
      return [];
    }
  }

  if (field.kind == "enum") {
    const enumSchema = enums.find((e) => e.name == field.type);
    if (enumSchema) {
      const matchingEnumValues = enumSchema.values.filter((v) =>
        v.name.toUpperCase().includes(query.toUpperCase())
      );
      return matchingEnumValues.map((v) => v.name);
    }
  }

  switch (field.type) {
    case "String": {
      return [{ contains: query, mode: "insensitive" }];
    }
    case "Int": {
      if (!query.match(isInt)) return [];
      const i = parseInt(query);
      return isNaN(i) ? [] : [i];
    }
    case "Float": {
      if (!query.match(isFloat)) return [];
      const f = parseFloat(query);
      return isNaN(f) ? [] : [f];
    }
  }

  return [];
}

function createWhereClause(
  query: string,
  schema: ModelSchema,
  enums: EnumSchema[],
  additionalSearchClauses?: (query: string) => Record<string, unknown>[]
): Record<string, unknown> | undefined {
  return query.length
    ? {
        OR: [
          ...schema.fields.flatMap((f) =>
            getTypedWhereValue(query, f, enums).map((v) => ({ [f.name]: v }))
          ),
          ...(additionalSearchClauses?.(query) ?? []),
        ],
      }
    : undefined;
}

export default function Search(props: {
  resourceName: string;
  setWhereClause: (whereClause: Record<string, unknown> | undefined) => void;
  additionalSearchClauses?: (query: string) => Record<string, unknown>[];
}) {
  const { trpc } = useAutoAdminContext();

  const schemaQuery = trpc.autoAdmin.getSchema.useQuery();
  const fullSchema = schemaQuery.data;
  const enumSchemas = fullSchema?.enums;
  const modelSchema = fullSchema?.models[props.resourceName];

  // Handle the "x" button in chrome
  const inputRef = useCallback(
    (node: HTMLInputElement | null) => {
      if (node !== null && "onsearch" in node) {
        node.onsearch = (e: ChangeEvent<HTMLInputElement>) => {
          if (e.currentTarget.value.length == 0) {
            props.setWhereClause(undefined);
          }
        };
      }
    },
    [props.setWhereClause]
  );

  return (
    <form
      className={styles["container"]}
      onSubmit={(e) => {
        e.preventDefault();
        const clause = createWhereClause(
          e.currentTarget["searchInput"].value,
          modelSchema!,
          enumSchemas ?? [],
          props.additionalSearchClauses
        );
        props.setWhereClause(clause);
      }}
    >
      <button
        type="submit"
        className={styles["search-button"]}
        disabled={!modelSchema}
      />
      <input
        disabled={!modelSchema}
        name="searchInput"
        type="search"
        placeholder="Search..."
        className={styles["search-input"]}
        ref={inputRef}
      />
    </form>
  );
}
