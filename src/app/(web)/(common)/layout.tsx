import CommonFooter from "@/components/Footer/CommonFooter/CommonFooter";
import CommonHeader from "@/components/Header/CommonHeader/CommonHeader";
import CommonLayout from "@/layouts/common/CommonLayout";

export default function HomeLayout(props: React.PropsWithChildren) {
  const { children } = props;

  return (
    <CommonLayout header={<CommonHeader />} footer={<CommonFooter />}>
      {children}
    </CommonLayout>
  );
}
