import {
  ExclamationTriangleIcon,
  InfoCircledIcon,
  CheckCircledIcon,
  CrossCircledIcon,
} from "@radix-ui/react-icons";
import styles from "./Alert.module.css";

export default function Alert(props: {
  children?: React.ReactNode;
  className?: string;
  title?: string;
  severity: "info" | "success" | "warning" | "error";
}) {
  return (
    <div
      className={`${styles["container"]} ${props.severity} ${
        props.className ?? ""
      }`}
    >
      {props.severity == "info" && (
        <InfoCircledIcon className={styles["icon"]} />
      )}
      {props.severity == "success" && (
        <CheckCircledIcon className={styles["icon"]} />
      )}
      {props.severity == "warning" && (
        <ExclamationTriangleIcon className={styles["icon"]} />
      )}
      {props.severity == "error" && (
        <CrossCircledIcon className={styles["icon"]} />
      )}

      <div className={styles["content"]}>
        {props.title && <div className={styles["title"]}>{props.title}</div>}
        {props.children}
      </div>
    </div>
  );
}
