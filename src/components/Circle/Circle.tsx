"use client";
import React, { useEffect, useState } from "react";
import classNames from "classnames/bind";
import styles from "./Circle.module.scss";
import Image from "next/image";
import { IPosition } from "@/views/Play/Play.view";

const cx = classNames.bind(styles);

interface ICircleProps {
  data: IPosition;
  setList: React.Dispatch<React.SetStateAction<IPosition[]>>;
}

const Circle = (props: ICircleProps) => {
  const { data, setList } = props;
  const [position, setPosition] = useState({ x: data.x, y: data.y });
  const [direction, setDirection] = useState<"down" | "right" | "left">("down");
  const [stop, setStop] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const HEIGHT = 50;
  const WIDTH = 50;

  useEffect(() => {
    const interval = setInterval(() => {
      if (stop) {
        clearInterval(interval);
        return;
      }
      setPosition((prev) => {
        if (direction === "down") {
          if (prev.y < window.innerHeight - HEIGHT) {
            return { ...prev, y: prev.y + 1 };
          } else {
            setDirection(Math.random() < 0.5 ? "right" : "left");
            return prev;
          }
        } else if (direction === "right") {
          if (prev.x < window.innerWidth - WIDTH) {
            return { ...prev, x: prev.x + 1 };
          } else {
            setList((prev) => {
              const index = prev.findIndex((e) => e.key === data.key);
              return [...prev.slice(0, index), ...prev.slice(index + 1)];
            });
            clearInterval(interval);
            return prev;
          }
        } else if (direction === "left") {
          if (prev.x > WIDTH) {
            return { ...prev, x: prev.x - 1 };
          } else {
            setList((prev) => {
              const index = prev.findIndex((e) => e.key === data.key);
              return [...prev.slice(0, index), ...prev.slice(index + 1)];
            });
            clearInterval(interval);
            return prev;
          }
        }
        return prev;
      });
    }, 2);

    return () => clearInterval(interval);
  }, [direction, stop]);

  return (
    <div className={cx("Circle")}>
      <Image
        src="/images/circle.png"
        alt="circle"
        width={WIDTH}
        height={HEIGHT}
      />
    </div>
  );
};

export default Circle;
