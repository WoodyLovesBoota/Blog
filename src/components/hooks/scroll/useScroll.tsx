import { debounce } from "lodash";
import { useState, useEffect } from "react";

const useScroll = () => {
  const [scroll, setScroll] = useState<number>(0);
  const [prevScroll, setPrevScroll] = useState<number>(0);
  const [scrollDir, setScrollDir] = useState<"up" | "down" | "top">("top");

  const onScrollDoc = () => {
    setScroll(document.scrollingElement?.scrollTop || 0);
  };

  useEffect(() => {
    if (!document) return;
    document.addEventListener("scroll", debounce(onScrollDoc, 300));

    return () =>
      document.removeEventListener("scroll", debounce(onScrollDoc, 300));
  }, []);

  useEffect(() => {
    if (scroll === 0) {
      setScrollDir("top");
    } else if (prevScroll < scroll) {
      setScrollDir("down");
    } else if (prevScroll > scroll) {
      setScrollDir("up");
    }
    setPrevScroll(scroll);
  }, [scroll, prevScroll]);

  const scrollTo = (target: number) => {
    window.scrollTo({ top: target, behavior: "smooth" });
  };

  return { scroll, scrollDir, scrollTo };
};

export default useScroll;
