import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import styled from "styled-components";

const NavigationBar = () => {
  const pathname = usePathname();

  return (
    <Wrapper>
      <ToggleBox>
        <Link href={"/"}>
          <ToggleContent isnow={String(pathname === "/")}>HOME</ToggleContent>
        </Link>
        <Link href={"/work"}>
          <ToggleContent isnow={String(pathname === "/work")}>WORK</ToggleContent>
        </Link>
        <Link href={"/life"}>
          <ToggleContent isnow={String(pathname === "/life")}>LIFE</ToggleContent>
        </Link>
      </ToggleBox>
    </Wrapper>
  );
};

export default NavigationBar;

const Wrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  padding-top: 20px;
  position: fixed;
  right: 0;
`;

const ToggleBox = styled.div`
  border-top: 1px solid black;
  padding: 0 10px;
  padding-right: 20px;
`;

const ToggleContent = styled.h2<{ isnow: string }>`
  cursor: pointer;
  font-size: 14px;
  font-weight: 300;
  margin: 5px 0;
  letter-spacing: 1px;
  &:hover {
    color: #ff0000;
  }
  color: ${(props) => (props.isnow === "true" ? "red" : "black")};
  transition: all 0.1s ease-in-out;
`;
