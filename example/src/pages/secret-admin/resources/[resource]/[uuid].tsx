import { Form, ModelsSidebar, AutoAdminContextProvider } from "auto-t3-admin";

import { api } from "~/utils/api";

export default function Index({}) {
  return (
    <AutoAdminContextProvider value={api}>
      <div style={{ display: "flex" }}>
        <ModelsSidebar />
        <Form />
      </div>
    </AutoAdminContextProvider>
  );
}
