"use client";

import HomeView from "@/views/Home/Home.view";
import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/firebaseClient";
import Loader from "@/components/Loader/Loader";

interface MetaDataProps {
    params: {};
}

const HomePage = () => {
    return <HomeView />;
};

export default HomePage;
