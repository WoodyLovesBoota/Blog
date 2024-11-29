"use client";

import HomeView from "@/views/Home/Home.view";
import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/firebaseClient";
import Loader from "@/components/Loader/Loader";

interface MetaDataProps {
  params: {};
}

// export async function generateMetadata({ params }: MetaDataProps) {
//   return {
//     title: "Home",
//     description: "Home Screen",
//   };
// }

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

const HomePage = () => {
  const [loading, setLoading] = useState(true);
  const [fetchedData, setFetchedData] = useState<any[]>();

  useEffect(() => {
    const fetchData = async () => {
      const data = await getData();
      setFetchedData(data);
      setTimeout(() => {
        setLoading(false);
      }, 1500);
    };
    fetchData();
  }, []);

  return (
    <>
      {loading ? (
        <Loader isData={fetchedData ? true : false} isLoading={loading} />
      ) : (
        <HomeView data={fetchedData} />
      )}
    </>
  );
};

export default HomePage;
