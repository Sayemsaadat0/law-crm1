import  { useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import LoadingBar, { type LoadingBarRef } from "react-top-loading-bar";

const TopLoader = () => {
  const ref = useRef<LoadingBarRef>(null);
  const location = useLocation();

  useEffect(() => {
    // Start bar when route changes
    ref.current?.continuousStart();

    // Complete bar after short delay (simulate page load)
    const timer = setTimeout(() => {
      ref.current?.complete();
    }, 500);

    return () => clearTimeout(timer);
  }, [location]);

  return <LoadingBar color="#d8f275" ref={ref} />;
};

export default TopLoader;