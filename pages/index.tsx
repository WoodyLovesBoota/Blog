import Seo from "@/components/Seo";
import styled from "styled-components";
import { GetServerSideProps } from "next";
import { firestore } from "../firebase/firebaseAdmin";
import { IBlogData } from "@/atoms";
import { useEffect, useRef, useState } from "react";
import { FixedSizeList as List, ListChildComponentProps } from "react-window";

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

const processData = (data: SortedDataType): SortedDataType => {
  let target = [...data];
  target.sort(() => Math.random() - 0.5);
  return target;
};

function preventDefault(e: Event) {
  e.preventDefault();
}

const Home = ({ data }: { data: IBlogData[] }) => {
  const [sortedData, setSortedData] = useState<SortedDataType>(Object.values(data[0].works[0]).flat());
  const [scrollPosition, setScrollPosition] = useState<number>(0);

  const items = Array.from({ length: 1000 }, (_, index) => ({
    id: index,
    label: `${sortedData[index % sortedData.length].title}`,
  }));
  const listRef = useRef<List>(null);

  useEffect(() => {
    setSortedData(processData([...Object.values(data[0].works[0]).flat(), ...Object.values(data[0].life[0]).flat()]));
  }, [data]);

  useEffect(() => {
    const scrollInterval = setInterval(() => {
      setScrollPosition((prevPosition) => prevPosition + 0.6);
    }, 30);
    window.addEventListener("DOMMouseScroll", preventDefault, false);
    window.addEventListener("wheel", preventDefault, { passive: false });
    window.addEventListener("touchmove", preventDefault, { passive: false });
    window.addEventListener("keydown", preventDefault, false);

    return () => {
      clearInterval(scrollInterval);
      window.removeEventListener("DOMMouseScroll", preventDefault, false);
      window.removeEventListener("wheel", preventDefault);
      window.removeEventListener("touchmove", preventDefault);
      window.removeEventListener("keydown", preventDefault, false);
    };
  }, []);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTo(scrollPosition);
    }
  }, [scrollPosition]);

  const Row: React.FC<ListChildComponentProps> = ({ index, style }) => (
    <div style={{ ...style, letterSpacing: "2px", fontSize: "24px", fontWeight: 300, color: "black" }}>{items[index].label}</div>
  );

  return (
    <Wrapper>
      <Seo title="WoodyLovesBootaBlog" />
      <Container>
        <StyledList height={1500} itemCount={items.length} itemSize={50} width={1080} ref={listRef}>
          {Row}
        </StyledList>
        <Bg>
          <Blur />
          <Mirror></Mirror>
          <Blur />
        </Bg>
      </Container>
    </Wrapper>
  );
};

export default Home;

const Wrapper = styled.div`
  width: 100vw;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Container = styled.div`
  width: 1080px;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100vh;
`;

const StyledList = styled(List)`
  overflow: hidden;
  height: 100vh;
  scroll-behavior: none;
  &::-webkit-scrollbar {
    background-color: transparent;
    display: none;
    width: 0;
  }

  &::-webkit-scrollbar-track {
    background-color: transparent;
    display: none;
  }

  &::-webkit-scrollbar-thumb {
    background-color: transparent;
    display: none;
    border-radius: 10px;
  }
`;

const Bg = styled.div`
  width: 100vw;
  height: 100vh;
  position: absolute;
`;

const Blur = styled.div`
  background: rgba(250, 250, 250, 0.6);
  /* backdrop-filter: blur(1px); */
  /* -webkit-backdrop-filter: blur(1px); */
  width: 100vw;
  height: calc(50vh - 30px);
`;

const Mirror = styled.div`
  background-color: transparent;
  width: 100vw;
  height: calc(60px);
`;

type SortedDataType = {
  title: string;
  date: string;
  content: string;
  numberDate: number;
  order: string;
}[];
