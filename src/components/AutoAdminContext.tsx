import { CreateTRPCNext } from "@trpc/next";
import { AnyRootConfig, CreateRouterInner, RootConfig } from "@trpc/server";
import { createContext, useContext } from "react";
import { createAdminRouter } from "../createAdminRouter";
import { NextPageContext } from "next";

type AdminRouter<Config extends AnyRootConfig> = CreateRouterInner<
  Config,
  {
    autoAdmin: CreateRouterInner<
      Config,
      Awaited<ReturnType<typeof createAdminRouter>>
    >;
  }
>;

type TRPCRouter<
  Config extends AnyRootConfig,
  TRouter extends AdminRouter<Config> = AdminRouter<Config>
> = CreateTRPCNext<TRouter, NextPageContext, null>;

const AutoAdminContextInternal = createContext<any>(null);

export function AutoAdminContextProvider<
  const Config extends AnyRootConfig,
  const TRouter extends AdminRouter<Config>
>(props: { children: React.ReactNode; value: TRPCRouter<Config, TRouter> }) {
  return (
    <AutoAdminContextInternal.Provider value={props.value}>
      {props.children}
    </AutoAdminContextInternal.Provider>
  );
}

export function useAutoAdminContext() {
  const ctx = useContext(AutoAdminContextInternal);
  if (!ctx)
    throw new Error(
      "Please wrap all auto-t3-admin pages in AutoAdminContextProvider"
    );
  return ctx as TRPCRouter<
    RootConfig<{
      ctx: any;
      meta: any;
      errorShape: any;
      transformer: { _default: false };
    }>
  >;
}
