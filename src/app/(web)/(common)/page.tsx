import HomeView from "@/views/Home/Home.view";
import React from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/firebaseClient";

interface MetaDataProps {
  params: {};
}

export async function generateMetadata({ params }: MetaDataProps) {
  return {
    title: "Home",
    description: "Home Screen",
  };
}

const getData = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "posts"));
    const farewellData = querySnapshot.docs.map((doc) => ({
      ...doc.data(),
    }));
    return farewellData;
  } catch (error) {
    console.error("Error fetching data from Firestore:", error);
    return [];
  }
};

const HomePage = async () => {
  const data = await getData();

  return <HomeView data={data} />;
};

export default HomePage;
