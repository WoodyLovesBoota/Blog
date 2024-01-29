import Link from "next/link";
import { usePathname } from "next/navigation";
import styled from "styled-components";
import styles from "./NavigationBar.module.scss";

const NavigationBar = () => {
  const pathname = usePathname();
  const isPathActive = (path: string): boolean => pathname.includes(path);

  return (
    <div className={`${styles.wrapper}`}>
      <div className={styles.nav_box}>
        <Link href="/">
          <h2 className={`${pathname === "/" ? styles.red : ""} ${styles.nav_content}`}>HOME</h2>
        </Link>
        <Link href="/work">
          <h2 className={`${isPathActive("/work") ? styles.red : ""} ${styles.nav_content}`}>WORK</h2>
        </Link>
        <Link href="/life">
          <h2 className={`${isPathActive("/life") ? styles.red : ""} ${styles.nav_content}`}>LIFE</h2>
        </Link>
      </div>
    </div>
  );
};

export default NavigationBar;
