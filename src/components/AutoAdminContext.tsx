import type { createTRPCNext } from "@trpc/next";
import { AnyRootConfig, CreateRouterInner, RootConfig } from "@trpc/server";
import { createContext, useContext } from "react";
import { createAdminRouter } from "../createAdminRouter";

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
> = Awaited<ReturnType<typeof createTRPCNext<TRouter>>>;

type InnerContextType = {
  trpc: TRPCRouter<
    RootConfig<{
      ctx: any;
      meta: any;
      errorShape: any;
      transformer: { _default: false };
    }>
  >;
  basePath: string;
};

const AutoAdminContextInternal = createContext<InnerContextType | null>(null);

export function AutoAdminContextProvider<
  const Config extends AnyRootConfig,
  const TRouter extends AdminRouter<Config>
>(props: {
  children: React.ReactNode;
  trpc: TRPCRouter<Config, TRouter>;
  basePath?: string;
}) {
  return (
    <AutoAdminContextInternal.Provider
      value={{
        trpc: props.trpc as any,
        basePath: props.basePath ?? "/admin",
      }}
    >
      {props.children}
    </AutoAdminContextInternal.Provider>
  );
}

export function useAutoAdminContext(): InnerContextType {
  const ctx = useContext(AutoAdminContextInternal);
  if (!ctx)
    throw new Error(
      "Please wrap all auto-t3-admin pages in AutoAdminContextProvider"
    );
  return ctx;
}
