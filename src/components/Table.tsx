import { useContext } from "react";
import { TriangleDownIcon, TriangleUpIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { useRouter } from "next/router";

import { CenteredLoader } from "./Loader";
import { normalizeQueryParam } from "../util";

import { FieldSchema, ModelSchema } from "../createAdminRouter";
import { formatTitle } from "./Form";
import styles from "./Table.module.css";
import { AutoAdminContext } from "./AutoAdminContext";

function displayData(model: ModelSchema, field: FieldSchema, val: unknown) {
  if (field.name == "id") {
    return <>{(val as any).toString().split("-")[0]}</>;
  }

  if (field.name.toUpperCase().endsWith("ID")) {
    const relation = model.fields.find((f) =>
      f.relationFromFields?.includes(field.name)
    );
    if (relation && val) {
      return (
        <Link href={`./${relation.type}/${val.toString()}`}>
          {val.toString().split("-")[0]}
        </Link>
      );
    }
  }
  if (val == null) {
    return <span style={{ color: "lightgrey" }}>NULL</span>;
  }

  if (field.type == "DateTime") {
    return <>{(val as any).toString().split("T")[0]}</>;
  }

  return (val as any).toString();
}

function PaginationButton(props: {
  curPage?: boolean;
  num: number;
  setPage: (n: number) => void;
}) {
  return (
    <li aria-current={props.curPage ? "page" : undefined}>
      <button
        onClick={() => props.setPage(props.num)}
        className={styles["pagination-button"]}
      >
        {props.num}
      </button>
    </li>
  );
}

function Pagination(props: {
  page: number;
  numPages: number;
  setPage: (n: number) => void;
}) {
  const first = 1;
  const cur = props.page;
  const curMinusTwo = cur - 2;
  const curMinusOne = cur - 1;
  const curPlusOne = cur + 1;
  const curPlusTwo = cur + 2;
  const last = props.numPages;

  return (
    <nav aria-label="pagination">
      <ul className={styles["pagination"]}>
        {curMinusTwo > first && (
          <PaginationButton num={first} setPage={props.setPage} />
        )}
        {curMinusTwo > first + 1 && <li>...</li>}
        {curMinusTwo >= 1 && (
          <PaginationButton num={curMinusTwo} setPage={props.setPage} />
        )}
        {curMinusOne >= 1 && (
          <PaginationButton num={curMinusOne} setPage={props.setPage} />
        )}
        <PaginationButton curPage={true} num={cur} setPage={props.setPage} />
        {curPlusOne <= last && (
          <PaginationButton num={curPlusOne} setPage={props.setPage} />
        )}
        {curPlusTwo <= last && (
          <PaginationButton num={curPlusTwo} setPage={props.setPage} />
        )}
        {curPlusTwo < last - 1 && <li>...</li>}
        {curPlusTwo < last && (
          <PaginationButton num={last} setPage={props.setPage} />
        )}
      </ul>
    </nav>
  );
}

export function parseSort(s: string): [string, "asc" | "desc"][] {
  return s.split(",").flatMap((s) => {
    const [col, dir] = s.split(":");
    if (col && dir && (dir == "asc" || dir == "desc")) {
      return [[col, dir]];
    } else {
      return [];
    }
  });
}

export default function Table<T extends Record<string, unknown>>(props: {
  resourceName: string;
  data: { numPages: number; results: T[] } | undefined;
  addedFields?: { name: string; display: (row: T) => React.ReactNode }[];
}) {
  const trpc = useContext(AutoAdminContext);
  if (!trpc)
    throw new Error("Please wrap the component in AutoAdminContext.Provider");

  const router = useRouter();
  const schemaQuery = trpc.autoAdmin.getSchema.useQuery();
  const page = parseInt(normalizeQueryParam(router.query["page"]) ?? "1");
  const sort = parseSort(normalizeQueryParam(router.query["sort"]) ?? "");

  function setPage(num: number) {
    router.query["page"] = `${num}`;
    router.push(router);
  }

  function setSort(order: [string, "asc" | "desc"][]) {
    router.query["sort"] = order
      .map(([key, dir]) => {
        return `${key}:${dir}`;
      })
      .join(",");
    router.push(router);
  }

  if (!router.isReady || !schemaQuery.data) {
    return <CenteredLoader />;
  }

  const fullSchema = schemaQuery.data;
  const modelSchema = fullSchema.models[props.resourceName];

  if (!modelSchema) {
    return <>Unknown model {props.resourceName}</>;
  }

  const scalarFields = modelSchema.fields.filter((d) => d.kind != "object");

  if (props.data == undefined) {
    return <CenteredLoader />;
  }

  return (
    <div>
      <table className={styles["table"]}>
        <thead>
          <tr>
            <th className={styles["header-cell"]}>
              <Link
                href={`./${props.resourceName}/new`}
                className={styles["new"]}
              >
                New
              </Link>
            </th>
            {scalarFields.map((f) => {
              const existingSort = sort.find(([col]) => col == f.name);
              return (
                <th
                  key={f.name}
                  className={styles["header-cell"]}
                  onClick={() => {
                    if (existingSort) {
                      setSort([
                        [f.name, existingSort[1] == "asc" ? "desc" : "asc"],
                        ...sort.filter(([col]) => col != f.name),
                      ]);
                    } else {
                      setSort([[f.name, "asc"], ...sort]);
                    }
                  }}
                >
                  {formatTitle(f)}
                  {existingSort && existingSort[1] == "asc" && (
                    <TriangleUpIcon />
                  )}
                  {existingSort && existingSort[1] == "desc" && (
                    <TriangleDownIcon />
                  )}
                </th>
              );
            })}
            {props.addedFields &&
              props.addedFields.map((field) => (
                <th key={field.name} className={styles["header-cell"]}>
                  {field.name}
                </th>
              ))}
          </tr>
        </thead>
        <tbody>
          {props.data.results.map((row) => (
            <tr key={row["id"]?.toString()} className={styles["row"]}>
              <td className={styles["cell"]}>
                <Link href={`./${props.resourceName}/${row["id"]}`}>Edit</Link>
              </td>
              {scalarFields.map((f) => (
                <td key={f.name} className={styles["cell"]}>
                  {displayData(modelSchema, f, row[f.name])}
                </td>
              ))}
              {props.addedFields &&
                props.addedFields.map((field) => (
                  <td key={field.name} className={styles["cell"]}>
                    {field.display(row)}
                  </td>
                ))}
            </tr>
          ))}
        </tbody>
      </table>
      {props.data.numPages > 1 && (
        <Pagination
          page={page}
          numPages={props.data.numPages}
          setPage={setPage}
        />
      )}
    </div>
  );
}
