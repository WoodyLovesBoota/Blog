const fs = require("fs");
const path = require("node:path");

const assetPath = path.resolve(__dirname, "../../public/static/icons");
const storyDist = path.resolve(__dirname, "../../src/lib/common/components/Icon/Icon.stories.tsx");
const iconComponentDist = path.resolve(__dirname, "../../src/lib/common/components/Icon/Icon.tsx");

const images = fs.readdirSync(assetPath).filter((file) => new RegExp(`.\/|.svg`).test(file));

const ext = /\.\w+/gi;
const snake = /\_(.)/gi;
const space = /\s(.)/gi;

const rename = (name) => {
  return name
    .replace(ext, "")
    .replace(space, (i) => i[1].toUpperCase())
    .replace(snake, (i) => i[1].toUpperCase())
    .split("")
    .map((char, idx) => (!idx ? char.toUpperCase() : char))
    .join("");
};

const iconCode = `
import React from "react";
import * as Icons from "@/lib/common/components/Icons";

type IconName = keyof typeof Icons;
type IconsProps = (typeof Icons)[IconName];
type IconProps = Omit<IconsProps, "size" | "color"> & {
  name: IconName;
  color?: string;
  size?: number;
  onClick?: (...args: any) => void;
  className?: string;
  [key: string]: any
};

export const Icon = (props: IconProps) => {
  const { name, size = 24, color, ...rest } = props;

  const Component = Icons[name];

  return (
    <Component
      width={size}
      height={size}
      color={color ?? "var(--simentic-on-surface, #121416)"}
      {...rest}
    />
  );
};
`;

fs.writeFileSync(iconComponentDist, iconCode);
