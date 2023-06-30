import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { HamburgerMenuIcon, Cross2Icon } from "@radix-ui/react-icons";

import { CenteredLoader } from "./Loader";
import { normalizeQueryParam } from "../util";

import buttonStyles from "./Button.module.css";

import styles from "./ModelsSidebar.module.css";
import { useAutoAdminContext } from "./AutoAdminContext";

export function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: 0,
    height: 0,
  });

  const handleSize = () => {
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  };

  useEffect(() => {
    handleSize();
    addEventListener("resize", handleSize);
    return () => removeEventListener("resize", handleSize);
  }, []);

  return windowSize;
}

export default function ModelsSidebar({}) {
  const router = useRouter();
  const trpc = useAutoAdminContext();

  const resourceName = normalizeQueryParam(router.query["resource"]) ?? "";
  const schema = trpc.autoAdmin.getSchema.useQuery();

  const { width } = useWindowSize();

  const [expanded, setExpanded] = useState(false);

  const isLargeScreen = width > 1500;

  if (!schema.data) {
    return <CenteredLoader />;
  }

  return (
    <nav className={styles["container"]}>
      {!isLargeScreen && (
        <button
          aria-expanded={expanded}
          className={buttonStyles["icon"]}
          onClick={() => setExpanded(!expanded)}
        >
          {!expanded && (
            <HamburgerMenuIcon width={"1.5rem"} height={"1.5rem"} />
          )}
          {expanded && <Cross2Icon width={"1.5rem"} height={"1.5rem"} />}
        </button>
      )}
      {(expanded || isLargeScreen) && (
        <>
          {Object.values(schema.data.models).map((e) => (
            <Link
              key={e.name}
              href={`/secret-admin/resources/${e.name}`}
              className={`primary ${styles["item"]}`}
              aria-current={
                resourceName
                  ? resourceName == e.name
                  : router.asPath.split("/").includes(e.name)
              }
            >
              {e.name}
            </Link>
          ))}
        </>
      )}
    </nav>
  );
}
