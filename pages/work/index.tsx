import Link from "next/link";
import styled from "styled-components";

const Work = () => {
  return (
    <Wrapper>
      <Title>Works</Title>
      <List>
        <MonthList>
          <MonthColumn>Nov 2023</MonthColumn>
          <MainColumn>
            <Link
              href={{
                pathname: `/work/1`,
                query: {
                  title: 1,
                },
              }}
            >
              <BlogContent>
                <BlogDate>23th</BlogDate>
                <BlogName>블로그 이름입니다.</BlogName>
              </BlogContent>
            </Link>
            <BlogContent>
              <BlogDate>23th</BlogDate>
              <BlogName>블로그 이름입니다.</BlogName>
            </BlogContent>
            <BlogContent>
              <BlogDate>23th</BlogDate>
              <BlogName>블로그 이름입니다.</BlogName>
            </BlogContent>
          </MainColumn>
        </MonthList>
      </List>
    </Wrapper>
  );
};

export default Work;

const Wrapper = styled.div`
  padding-top: 70px;
  padding-left: 100px;
`;

const Title = styled.h2`
  font-size: 28px;
  font-weight: 300;
`;

const List = styled.div`
  margin-top: 160px;
`;

const MonthList = styled.div`
  display: flex;
`;

const MonthColumn = styled.h2`
  margin-right: 100px;
`;

const MainColumn = styled.div``;

const BlogContent = styled.div`
  margin-bottom: 50px;
`;

const BlogDate = styled.h2`
  font-weight: 200;
`;

const BlogName = styled.h2`
  font-size: 21px;
  font-weight: 400;
  margin-left: 10px;
`;
