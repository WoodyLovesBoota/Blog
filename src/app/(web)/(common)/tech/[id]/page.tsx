"use client";

import DetailView from "@/views/Detail/Detail.view";
import React, { useEffect, useState } from "react";

interface PageProps {
  params: {
    id: string;
  };
  searchParams: {
    title: string;
  };
}

export default function SearchPage(props: PageProps) {
  return <DetailView id={props.params.id} title={props.searchParams.title} />;
}
