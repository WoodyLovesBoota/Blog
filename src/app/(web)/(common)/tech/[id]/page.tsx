import DetailView from "@/views/Detail/Detail.view";
import React from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/firebaseClient";

interface PageProps {
  params: {
    id: string;
  };
}

async function getData(keyword: string) {
  try {
    const querySnapshot = await getDocs(collection(db, "posts"));
    const farewellData = querySnapshot.docs.map((doc) => ({
      ...doc.data(),
    }));
    return farewellData[0].tech.list.find(
      (item: any) => item.id === Number(keyword)
    );
  } catch (error) {
    console.error("Error fetching data from Firestore:", error);
    return [];
  }
}

export default async function SearchPage(props: PageProps) {
  const { params } = props;
  const data = await getData(params.id);

  return <DetailView data={data} />;
}
