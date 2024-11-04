import FullLayout from "@/layouts/full/FullLayout";

export default function FullLayoutPage(props: React.PropsWithChildren) {
  const { children } = props;

  return <FullLayout>{children}</FullLayout>;
}
