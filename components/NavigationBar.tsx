import Link from "next/link";
import { useState } from "react";
import styled from "styled-components";

const NavigationBar = () => {
  return (
    <Wrapper>
      <ToggleBox>
        <Link href={"/"}>
          <ToggleContent>Home</ToggleContent>
        </Link>
        <Link href={"/work"}>
          <ToggleContent>Work</ToggleContent>
        </Link>
        <Link href={"/life"}>
          <ToggleContent>Life</ToggleContent>
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
`;

const ToggleBox = styled.div`
  border-top: 1px solid black;
  padding: 0 10px;
  padding-right: 20px;
`;

const ToggleContent = styled.h2`
  cursor: pointer;
  font-size: 16px;
  font-weight: 300;
`;
