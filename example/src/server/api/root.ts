import { Prisma } from "@prisma/client";
import { createAdminRouter } from "auto-t3-admin";
import { exampleRouter } from "~/server/api/routers/example";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { prisma } from "~/server/db";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  example: exampleRouter,
  autoAdmin: createTRPCRouter(
    // Use a procedure only accessible by admins or else you will expose your prod db!
    await createAdminRouter(publicProcedure, Prisma.ModelName, prisma)
  ),
});

// export type definition of API
export type AppRouter = typeof appRouter;
