# auto-t3-admin

This is an automatically generated, deployable admin panel designed to be used with NextJS, trpc and prisma. The `example/` folder contains an example of this package being used with a basic create-t3-app install.

# Install

```
npm install zynq-inc/auto-t3-admin
yarn add auto-t3-admin@zynq-inc/auto-t3-admin
```

See [below](#usage) for basic usage docs.

# Features:

- Automatically browse all of your data
- Magically search ~all~ most fields
- Sort by (multiple) column
- View, edit, create and delete records in your DB
- Use NextJS routing for your admin pages
- Add extra custom components if you want
- Somewhat mobile-usable

## Screenshots

### Table

![image](https://github.com/zynq-inc/auto-t3-admin/assets/2154522/aa7b0f02-e08d-471d-98da-9580538aed93)

### Row Edit

![image](https://github.com/zynq-inc/auto-t3-admin/assets/2154522/74a162ac-0c19-4a06-a15f-2d60e9210819)

# Usage

First, add a trpc router that will expose all your prisma models to your admin frontend. Use a admin-only protected procedure!!!

src/server/api/root.ts

```diff
import { exampleRouter } from "~/server/api/routers/example";
+import { Prisma } from "@prisma/client";
+import { createAdminRouter } from "auto-t3-admin";
+import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
+import { prisma } from "~/server/db";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  example: exampleRouter,
+  // Use a procedure only accessible by admins or else you will expose your prod db!
+  autoAdmin: createTRPCRouter(
+    await createAdminRouter(publicProcedure, Prisma.ModelName, prisma)
+  ),
});

// export type definition of API
export type AppRouter = typeof appRouter;
```

Then, add some pages to your NextJS app so you can interact with the endpoints.

The first is the homepage of your admin section. As with any of these pages, feel free to
customize them however you want.

src/pages/admin/index.tsx

```typescript
import { ModelsSidebar, AutoAdminContextProvider } from "auto-t3-admin";
import { api } from "~/utils/api";

export default function Index({}) {
  return (
    <AutoAdminContextProvider trpc={api}>
      <div style={{ display: "flex" }}>
        <ModelsSidebar />
        <div>
          <h1>ADMIN HOME</h1>
        </div>
      </div>
    </AutoAdminContextProvider>
  );
}
```

Next is the table view:

src/pages/admin/resources/\[resource\]/index.ts

```typescript
import {
  ModelsSidebar,
  SearchTable,
  AutoAdminContextProvider,
} from "auto-t3-admin";
import { api } from "~/utils/api";

export default function Index({}) {
  return (
    <AutoAdminContextProvider trpc={api}>
      <div style={{ display: "flex" }}>
        <ModelsSidebar />
        <SearchTable />
      </div>
    </AutoAdminContextProvider>
  );
}
```

Next is the resource edit view:

src/pages/admin/resources/\[resource\]/\[uuid\].ts

```typescript
import { Form, ModelsSidebar, AutoAdminContextProvider } from "auto-t3-admin";
import { api } from "~/utils/api";

export default function Index({}) {
  return (
    <AutoAdminContextProvider trpc={api}>
      <div style={{ display: "flex" }}>
        <ModelsSidebar />
        <Form />
      </div>
    </AutoAdminContextProvider>
  );
}
```

## Customization

- If you want to put your admin panel somewhere other than "/admin", pass a basePath prop to AutoAdminContextProvider.

src/pages/my-secret-admin-panel/index.tsx

```typescript
import { ModelsSidebar, AutoAdminContextProvider } from "auto-t3-admin";
import { api } from "~/utils/api";

export default function Index({}) {
  return (
    <AutoAdminContextProvider trpc={api} basePath="/my-secret-admin-panel">
      <div style={{ display: "flex" }}>
        <ModelsSidebar />
        <div>
          <h1>ADMIN HOME</h1>
        </div>
      </div>
    </AutoAdminContextProvider>
  );
}
```
