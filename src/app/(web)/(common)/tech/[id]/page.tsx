import DetailView from "@/views/Detail/Detail.view";
import React from "react";

interface PageProps {
  params: {
    id: string;
  };
}

async function getData(keyword: string) {
  // try {
  //   const data = await naverService.getBookListServer({
  //     query: { query: keyword },
  //   });
  //   return data;
  // } catch (error) {
  //   console.error(error);
  //   return null;
  // }
}

export default async function SearchPage(props: PageProps) {
  const { params } = props;
  // const searchData = await getData(decodeURI(params.keyword));

  return <DetailView />;
}
