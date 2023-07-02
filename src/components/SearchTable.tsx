import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import Search from "./Search";
import Table, { parseSort } from "./Table";
import { normalizeQueryParam } from "../util";
import { useAutoAdminContext } from "./AutoAdminContext";

export default function SearchTable(props: {
  resourceName?: string;
  page?: number;
}) {
  const { trpc } = useAutoAdminContext();

  const router = useRouter();
  const resourceName =
    props.resourceName ?? normalizeQueryParam(router.query["resource"]) ?? "";
  const page =
    props.page ?? parseInt(normalizeQueryParam(router.query["page"]) ?? "1");
  const sort = parseSort(normalizeQueryParam(router.query["sort"]) ?? "");

  const [searchWhereClause, setSearchWhereClause] =
    useState<Record<string, unknown>>();

  useEffect(() => {
    setSearchWhereClause(undefined);
  }, [resourceName]);

  const list = trpc.autoAdmin.getResource.useQuery(
    {
      table: resourceName,
      orderBy: sort.map(([col, dir]) => ({ [col]: dir })),
      where: searchWhereClause,
      pagination: { page: page - 1 },
    },
    { enabled: router.isReady }
  );

  return (
    <div
      style={{ display: "flex", flexDirection: "column", marginBlock: "1rem" }}
    >
      <Search
        key={resourceName}
        resourceName={resourceName}
        setWhereClause={setSearchWhereClause}
      />
      <Table resourceName={resourceName} data={list.data} />
    </div>
  );
}
