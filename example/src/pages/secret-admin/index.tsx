import { ModelsSidebar, AutoAdminContextProvider } from "auto-t3-admin";
import { api } from "~/utils/api";

export default function Index({}) {
  return (
    <AutoAdminContextProvider value={api}>
      <div style={{ display: "flex" }}>
        <ModelsSidebar />
        <div>
          <h1>ADMIN HOME</h1>
        </div>
      </div>
    </AutoAdminContextProvider>
  );
}
