import Link from "next/link";
import { usePathname } from "next/navigation";
import styled from "styled-components";

const NavigationBar = () => {
  const pathname = usePathname();
  const isPathActive = (path: string): boolean => pathname.includes(path);

  return (
    <Wrapper>
      <ToggleBox>
        <NavigationLink href="/" isActive={pathname === "/"}>
          HOME
        </NavigationLink>
        <NavigationLink href="/work" isActive={isPathActive("/work")}>
          WORK
        </NavigationLink>
        <NavigationLink href="/life" isActive={isPathActive("/life")}>
          LIFE
        </NavigationLink>
      </ToggleBox>
    </Wrapper>
  );
};

const NavigationLink = ({ href, isActive, children }: NavigationLinkProps) => (
  <Link href={href}>
    <ToggleContent isActive={isActive}>{children}</ToggleContent>
  </Link>
);

export default NavigationBar;

const Wrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  padding-top: 20px;
  position: fixed;
  display: flex;
  justify-content: flex-end;
  width: 100vw;
  left: 0;
  z-index: 2;
`;

const ToggleBox = styled.div`
  border-top: 1px solid black;
  padding: 0 10px;
  padding-right: 20px;
`;

const ToggleContent = styled.h2<ToggleContentProps>`
  cursor: pointer;
  font-size: 14px;
  font-weight: 400;
  margin: 5px 0;
  letter-spacing: 1px;
  &:hover {
    color: #ff0000;
  }
  color: ${(props) => (props.isActive ? "#ff0000" : "000000")};
  transition: all 0.1s ease-in-out;
`;

interface NavigationLinkProps {
  href: string;
  isActive: boolean;
  children: React.ReactNode;
}

interface ToggleContentProps {
  isActive: boolean;
}
