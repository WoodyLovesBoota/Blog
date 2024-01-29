import NavigationBar from "./NavigationBar/NavigationBar";

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
