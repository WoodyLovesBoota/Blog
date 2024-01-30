import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./NavigationBar.module.scss";
import cn from "classnames/bind";

const cx = cn.bind(styles);

const NavigationBar = () => {
  const pathname = usePathname();
  const isPathActive = (path: string): boolean => pathname.includes(path);

  return (
    <div className={cx("Wrapper")}>
      <div className={cx("NavBox")}>
        <Link href="/">
          <h2 className={cx("NavContent", pathname === "/" ? "Red" : "")}>HOME</h2>
        </Link>
        <Link href="/work">
          <h2 className={cx("NavContent", isPathActive("/work") ? "Red" : "")}>WORK</h2>
        </Link>
        <Link href="/life">
          <h2 className={cx("NavContent", isPathActive("/life") ? "Red" : "")}>LIFE</h2>
        </Link>
      </div>
    </div>
  );
};

export default NavigationBar;
