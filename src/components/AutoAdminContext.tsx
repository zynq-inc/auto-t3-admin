import { CreateTRPCNext } from "@trpc/next";
import { AnyRootConfig, CreateRouterInner } from "@trpc/server";
import { createContext } from "react";
import { createAdminRouter } from "../createAdminRouter";
import { NextPageContext } from "next";

type AdminRouter = CreateRouterInner<
  AnyRootConfig,
  {
    autoAdmin: CreateRouterInner<
      AnyRootConfig,
      Awaited<ReturnType<typeof createAdminRouter>>
    >;
  }
>;

type TRPCRouter<TRouter extends AdminRouter> = CreateTRPCNext<
  TRouter,
  NextPageContext,
  null
>;

export const AutoAdminContext = createContext<TRPCRouter<AdminRouter> | null>(
  null
);
