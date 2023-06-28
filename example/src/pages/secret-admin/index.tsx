import { ModelsSidebar, AutoAdminContext } from "auto-t3-admin";
import { api } from "~/utils/api";

export default function Index({}) {
  return (
    <AutoAdminContext.Provider value={api}>
      <div style={{ display: "flex" }}>
        <ModelsSidebar />
        <div>
          <h1>ADMIN HOME</h1>
        </div>
      </div>
    </AutoAdminContext.Provider>
  );
}
