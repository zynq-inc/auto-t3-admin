import { ModelsSidebar, SearchTable, AutoAdminContext } from "auto-t3-admin";
import { api } from "~/utils/api";

export default function Index({}) {
  return (
    <AutoAdminContext.Provider value={api}>
      <div style={{ display: "flex" }}>
        <ModelsSidebar />
        <SearchTable />
      </div>
    </AutoAdminContext.Provider>
  );
}
