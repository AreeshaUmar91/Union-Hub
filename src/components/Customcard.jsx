import React, { useEffect } from "react";

export const Customcard = ({
  heading,
  content,
  button1Text,
  button2Text,
  onButton1Click,
  onButton2Click,
  button1Bg = "bg-gray-400",
  button2Bg = "bg-blue-500",
  onClose, 
}) => {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    // Overlay (black transparent background)
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex  items-center justify-center z-50 p-4"
      onClick={onClose} // close modal if user clicks outside the card
    >
      {/* Card container */}
      <div
        className="bg-white border border-gray-300 rounded-[30px] shadow-md flex flex-col items-center justify-center w-full max-w-[450px]"
        style={{
          minHeight: "180px",
          padding: "29px",
          gap: "20px",
        }}
        onClick={(e) => e.stopPropagation()} // prevent overlay close when clicking inside
      >
        {/* Heading */}
        <h2 className="font-montserrat font-semibold text-[24px] text-black text-center leading-[100%]">
          {heading}
        </h2>
<div className="font-montserrat font-normal text-[16px] text-gray-500 text-center leading-[20px] break-words">
  {content}
</div>


        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center items-center">
          <button
            onClick={onButton1Click}
            className={`w-full sm:w-[170px] h-[42px] rounded-full text-white font-montserrat ${button1Bg}`}
          >
            {button1Text}
          </button>
          <button
            onClick={onButton2Click}
            className={`w-full sm:w-[170px] h-[42px] rounded-full text-white font-montserrat ${button2Bg}`}
          >
            {button2Text}
          </button>
        </div>
      </div>
    </div>
  );
};
