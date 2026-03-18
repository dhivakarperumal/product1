// src/components/ScrollNavigator.jsx
import React, { useEffect, useState } from "react";
import { IoIosArrowUp, IoIosArrowDown } from "react-icons/io";

const ScrollNavigator = () => {
  const [showButtons, setShowButtons] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setShowButtons(window.scrollY > 100);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToBottom = () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  return (
    showButtons && (
      <div className="fixed right-4 bottom-5 z-30 flex flex-col gap-3">
        <button
          onClick={scrollToTop}
          className="bg-white text-black p-2 cursor-pointer rounded-full shadow-md  transition"
          aria-label="Scroll to top"
        >
          <IoIosArrowUp size={24} />
        </button>
      </div>
    )
  );
};

export default ScrollNavigator;