import { ExternalLinkIcon } from "@radix-ui/react-icons";
import { UseTRPCQueryResult } from "@trpc/react-query/shared";
import { DateTime } from "luxon";
import { useRouter } from "next/router";
import { DetailedHTMLProps, InputHTMLAttributes, useState } from "react";

import Alert from "./Alert";
import { CenteredLoader } from "./Loader";
import buttonStyles from "./Button.module.css";
import {
  EnumSchema,
  FieldSchema,
  FullSchema,
  ModelSchema,
} from "../createAdminRouter";

import formStyles from "./form.module.css";
import { useAutoAdminContext } from "./AutoAdminContext";
import { normalizeQueryParam } from "../util";

// TODO: if there are multiple capitalized letters in a row, then check if there's a following lowercase.
// - if yes, then combine the uppercase letters into one word, minus the last one
// - if no, combine all the uppercase letters into one word
export function formatTitle(field: FieldSchema) {
  const remapID = field.name.replace(/ID/g, "Id");
  const result = remapID.replace(/([A-Z])/g, " $1");
  const upperID = result.replace(/[iI]d/g, "ID");
  const formattedTitle = upperID.charAt(0).toUpperCase() + upperID.slice(1);
  if (field.type == "DateTime") {
    return `${formattedTitle} (UTC)`;
  }
  return formattedTitle;
}

function getDefaultValue(type: string, enums: EnumSchema[]) {
  const defaultsMap: Record<string, unknown> = {
    String: "",
    Int: 1,
    Float: 0,
    Boolean: false,
  };
  if (type in defaultsMap) {
    return defaultsMap[type];
  }
  if (type == "DateTime") {
    return DateTime.utc().toISO();
  }
  const enumDef = enums.find((e) => e.name == type);
  if (enumDef && enumDef.values[0]?.name) {
    return enumDef.values[0].name;
  }
  return "";
}

function MaybeNullableDataInput(props: {
  model: ModelSchema;
  enums: EnumSchema[];
  field: FieldSchema;
  data: unknown;
  onChange: (v: unknown) => void;
}) {
  return (
    <div className={formStyles["nullable-container"]}>
      {!props.field.isRequired && (
        <label className={formStyles["nullable-label"]}>
          <input
            type="checkbox"
            className={formStyles["nullable-checkbox"]}
            checked={props.data == null}
            onChange={(e) => {
              props.onChange(
                e.currentTarget.checked
                  ? null
                  : getDefaultValue(props.field.type, props.enums)
              );
            }}
          />
          NULL
        </label>
      )}
      <DataInput {...props} disabled={props.data == null} />
    </div>
  );
}

// TODO handle nullability by adding a checkbox for fields with isRequired: false in the schema
function DataInput(props: {
  model: ModelSchema;
  enums: EnumSchema[];
  field: FieldSchema;
  data: unknown;
  onChange: (v: unknown) => void;
  disabled: boolean;
}) {
  const { basePath } = useAutoAdminContext();
  const commonProps = {
    disabled:
      props.disabled ||
      ["id", "createdAt", "updatedAt"].includes(props.field.name),
    className: formStyles["common-input"],

    value: (props.data && (props.data as any).toString()) ?? "",
  } satisfies DetailedHTMLProps<
    InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  >;

  if (props.field.kind == "enum") {
    const actualEnum = props.enums.find((e) => e.name == props.field.type);
    if (actualEnum) {
      return (
        <select
          onChange={(e) => {
            props.onChange(e.currentTarget.value);
          }}
          value={(props.data && (props.data as any).toString()) ?? ""}
        >
          {actualEnum.values.map((v) => (
            <option key={v.name} value={v.name}>
              {v.name}
            </option>
          ))}
        </select>
      );
    }
  }

  switch (props.field.type) {
    case "String":
      const idField = props.model.fields.find((f) =>
        f.relationFromFields?.includes(props.field.name)
      );
      return (
        <>
          <input
            type="text"
            {...commonProps}
            onChange={(e) => {
              props.onChange(e.currentTarget.value);
            }}
          />
          {idField && props.data && (
            <a
              className={formStyles["view-reference"]}
              aria-disabled
              target="_blank"
              href={`${basePath}/resources/${idField.type}/${props.data}`}
            >
              <ExternalLinkIcon />
              VIEW
            </a>
          )}
        </>
      );
    case "Float":
      return (
        <input
          type="number"
          {...commonProps}
          onChange={(e) => {
            props.onChange(parseFloat(e.currentTarget.value));
          }}
        />
      );
    case "Int":
      return (
        <input
          type="number"
          {...commonProps}
          onChange={(e) => {
            props.onChange(parseInt(e.currentTarget.value));
          }}
        />
      );
    case "Boolean":
      return (
        <input
          type="checkbox"
          style={{ aspectRatio: 1, height: "3rem" }}
          {...commonProps}
          className=""
          checked={props.data as boolean}
          onChange={(e) => {
            props.onChange(e.currentTarget.checked);
          }}
        />
      );
    case "DateTime":
      return (
        <input
          type="datetime-local"
          {...commonProps}
          // The specified value "2023-06-02T16:24:17.129Z" does not conform to the required format.
          // The format is "yyyy-MM-ddThh:mm" followed by optional ":ss" or ":ss.SSS".
          value={commonProps.value.split(".")[0]}
          onChange={(e) => {
            props.onChange(e.currentTarget.value + ".000Z");
          }}
        />
      );
  }
  return <input type="text" {...commonProps} data-unknown={props.field.type} />;
}

function filterObject<T>(
  obj: Record<string, T>,
  filter: (k: string, t: T) => boolean
) {
  const copy = { ...obj };
  for (const key of Object.keys(copy)) {
    const v = copy[key];
    if (v && !filter(key, v)) {
      delete copy[key];
    }
  }
  return copy;
}

function mapObject<T, U>(obj: Record<string, T>, map: (k: string, t: T) => U) {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, map(k, v)])
  );
}

export default function Form<T extends Record<string, any>>(props: {
  formValue?: T | undefined;
  setFormValue?: (t: T) => void;
  resourceName?: string;
  id?: "new" | string; // "new" when creating new record
  loading?: boolean;
}) {
  const router = useRouter();

  const resourceName =
    props.resourceName ?? normalizeQueryParam(router.query["resource"])!;
  const uuid = props.id ?? normalizeQueryParam(router.query["uuid"])!;

  const isCreate = uuid == "new";
  const { trpc, basePath } = useAutoAdminContext();
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string>();

  const [formValueInner, setFormValueInner] = useState<T>({} as T);

  const formValue = props.formValue ?? formValueInner;
  const setFormValue = props.setFormValue ?? setFormValueInner;

  const getSchema = trpc.autoAdmin.getSchema.useQuery();
  const fullSchema = getSchema?.data;

  const list = trpc.autoAdmin.getResource.useQuery(
    { table: resourceName, where: { id: uuid } },
    {
      onSuccess(res) {
        const result = res.results[0]!;
        setFormValue(
          mapObject(result, (k, v) =>
            touched[k] && props.formValue ? props.formValue[k] : v
          ) as T
        );
      },
      enabled: !isCreate && !!uuid && !!resourceName,
    }
  );

  const updateMutation = trpc.autoAdmin.updateResource.useMutation();
  const deleteMutation = trpc.autoAdmin.deleteResource.useMutation();
  const createMutation = trpc.autoAdmin.createResource.useMutation();

  const mutationIsLoading =
    props.loading ||
    updateMutation.isLoading ||
    createMutation.isLoading ||
    deleteMutation.isLoading;

  if ((!isCreate && !list.data) || !fullSchema) {
    return <CenteredLoader />;
  }

  const data = list.data?.results[0];
  if (!data && !isCreate) {
    return <h1>404</h1>;
  }

  const enums = fullSchema.enums;
  const modelSchema = fullSchema.models[resourceName];

  if (!modelSchema) {
    return <>Unknown model {resourceName}</>;
  }

  const scalarFields = modelSchema.fields.filter((d) => d.kind != "object");

  return (
    <div className={formStyles["page-container"]}>
      {error && (
        <Alert severity="error" title="Error">
          {error}
        </Alert>
      )}
      <ul className={formStyles["entry-list"]}>
        {scalarFields.map((f) => (
          <li className={formStyles["entry"]} key={f.name}>
            {formatTitle(f)}{" "}
            <MaybeNullableDataInput
              model={modelSchema}
              enums={enums}
              field={f}
              data={formValue?.[f.name]}
              onChange={(newVal) => {
                setFormValue({
                  ...(formValue ?? ({} as T)),
                  [f.name]: newVal,
                });
                setTouched({ ...touched, [f.name]: true });
              }}
            />
          </li>
        ))}
      </ul>
      <div className={formStyles["actions"]}>
        {isCreate && (
          <button
            disabled={!formValue || mutationIsLoading}
            data-loading={mutationIsLoading}
            className={`${buttonStyles["base"]}`}
            onClick={() => {
              if (!formValue) {
                return alert("Failsafe: Can't create with no data");
              }
              createMutation
                .mutateAsync({
                  table: resourceName,
                  data: formValue,
                })
                .then((res) =>
                  router.replace(
                    `${basePath}/resources/${resourceName}/${res["id"]}`
                  )
                )
                .catch((e) => setError(e.message));
            }}
          >
            Create
          </button>
        )}
        {!isCreate && (
          <button
            disabled={
              !formValue ||
              Object.values(touched).length == 0 ||
              mutationIsLoading
            }
            data-loading={mutationIsLoading}
            className={`${buttonStyles["base"]}`}
            onClick={() => {
              if (!uuid) {
                return alert("Failsafe: Can't edit with no ID");
              }
              if (!formValue) {
                return alert("Failsafe: Can't update with no data");
              }
              updateMutation
                .mutateAsync({
                  table: resourceName,
                  where: { id: uuid },
                  data: filterObject(
                    formValue,
                    (k) => !!touched[k]
                  ) as Partial<T>,
                })
                .then(() => {
                  setTouched({});
                  setError(undefined);
                })
                .catch((e) => setError(e.message));
            }}
          >
            Save
          </button>
        )}
        {!isCreate && (
          <button
            disabled={mutationIsLoading}
            data-loading={mutationIsLoading}
            className={`error ${buttonStyles["base"]}`}
            onClick={() => {
              if (!uuid) {
                return alert("Failsafe: Can't delete with no ID");
              }
              deleteMutation
                .mutateAsync({
                  table: resourceName,
                  where: { id: uuid },
                })
                .then(() => {
                  router.back();
                })
                .catch((e) => setError(e.message));
            }}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
