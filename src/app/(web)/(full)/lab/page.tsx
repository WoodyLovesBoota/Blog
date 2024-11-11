import LabView from "@/views/Lab/Lab.view";
import React from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/firebaseClient";

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

const LabPage = async () => {
  const data = await getData();

  return <LabView data={data} />;
};

export default LabPage;
