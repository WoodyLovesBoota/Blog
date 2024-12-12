"use client";

import cn from "classnames/bind";
import styles from "./Play.view.module.scss";
import Circle from "@/components/Circle/Circle";
import { useState } from "react";

const cx = cn.bind(styles);

export interface IPosition {
  x: number;
  y: number;
  key: number;
}

const PlayView = () => {
  const [list, setList] = useState<IPosition[]>([]);
  const [lastKey, setLastKey] = useState<number>(0);
  const handleClick: React.MouseEventHandler<HTMLDivElement> = (event) => {
    const mouseX: number = event.clientX;
    const mouseY: number = event.clientY;
    setList([...list, { x: mouseX, y: mouseY, key: lastKey + 1 }]);
    setLastKey((prev) => prev + 1);
  };

  return (
    <div className={cx("Wrapper")} onClick={handleClick}>
      {list.map((item) => (
        <Circle key={item.key} data={item} setList={setList} />
      ))}
    </div>
  );
};

export default PlayView;
