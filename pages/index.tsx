import Seo from "@/components/Seo";
import styled from "styled-components";
import { GetServerSideProps } from "next";
import { firestore } from "../firebase/firebaseAdmin";
import NavigationBar from "@/components/NavigationBar";
import { IBlogData } from "@/atoms";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const snapshot = await firestore.collection("posts").get();
  const data = snapshot.docs.map((doc) => {
    return Object.assign(doc.data(), { id: doc.id });
  });

  return {
    props: {
      data,
    },
  };
};

const Home = ({ data }: { data: IBlogData[] }) => {
  // console.log(data);
  return (
    <Wrapper>
      <Seo title="WoodylovesBoota" />
      {/* {data[0].works[0]} */}
    </Wrapper>
  );
};

export default Home;

const Wrapper = styled.div`
  width: 100vw;
`;
