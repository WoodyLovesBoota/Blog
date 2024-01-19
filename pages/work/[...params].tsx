import Seo from "@/components/Seo";
import styled from "styled-components";
import { GetServerSideProps } from "next";
import { firestore } from "../../firebase/firebaseAdmin";
import NavigationBar from "@/components/NavigationBar";
import { useRouter } from "next/router";
import { IBlogData } from "@/atoms";
import ReactMarkdown, { Components } from "react-markdown";
import Image from "next/image";

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

const Detail = ({ data }: { data: IBlogData[] }) => {
  const router = useRouter();
  const [title] = router.query.params || [];

  const customRenderers: Components = {
    img: ({ src, alt }) => {
      if (src) {
        return <Image src={src} alt={alt || ""} width={500} height={300} />;
      }
      return null;
    },
  };

  return (
    <Wrapper>
      <Seo title={title} />
      <Container></Container>
      <Subject>{data[0].works[0]["202401"][0].title}</Subject>
      <Date>{data[0].works[0]["202401"][0].date}</Date>
      <Main>
        <MarkDownContainer>
          {data[0].works[0]["202401"][0].content.split(".").map((ele) => (
            <ReactMarkdown components={customRenderers}>{ele}</ReactMarkdown>
          ))}
        </MarkDownContainer>
      </Main>
    </Wrapper>
  );
};

export default Detail;

const Wrapper = styled.div`
  width: 100vw;
`;

const Container = styled.div``;

const Subject = styled.h2``;

const Date = styled.h2``;

const ImageWrapper = styled.div``;

const Title = styled.h2``;

const Subtitle = styled.h2``;

const Bold = styled.h2``;

const Description = styled.h2``;

const Main = styled.div``;

const MarkDownContainer = styled.div`
  h1 {
    color: #333;
    font-size: 2em;
    margin-bottom: 0.5em;
  }

  h2 {
    color: #666;
    font-size: 1.5em;
    margin-bottom: 0.5em;
  }

  p {
    color: #444;
    margin-bottom: 1em;
  }

  a {
    color: #0066cc;
    text-decoration: none;
  }

  ul {
    padding-left: 20px;
  }

  li {
    margin-bottom: 0.5em;
  }
`;
