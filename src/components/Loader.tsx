import styles from "./Loader.module.css";

export default function Loader() {
  return <div className={styles.hourglass} />;
}

export function CenteredLoader(props: {}) {
  return (
    <div className={styles["centered-parent"]}>
      <Loader {...props} />
    </div>
  );
}
