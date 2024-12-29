"use client";

import DetailView from "@/views/Detail/Detail.view";
import React, { useEffect, useState } from "react";

interface PageProps {
    params: {
        id: string;
    };
}

export default function SearchPage(props: PageProps) {
    const [mounted, setMounted] = useState(false);

    return <DetailView />;
}
