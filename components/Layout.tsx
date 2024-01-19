import NavigationBar from "./NavigationBar";

const Layout = ({ children }: Ititle) => {
  return (
    <>
      <NavigationBar />
      <div>{children}</div>
    </>
  );
};

export default Layout;

interface Ititle {
  children: React.ReactNode;
}
