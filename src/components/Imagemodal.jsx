import { useEffect } from "react";
import { mediaData } from "../utils/mediaData";

export const Imagemodal = ({ heading, subheading, onClose }) => {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    // Overlay
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose} // close modal when clicking on overlay
    >
      {/* Modal container */}
      <div
        className="bg-white rounded-[30px] w-full max-w-[340px] h-auto min-h-[337px] p-[32px_20px_32px_20px] flex flex-col items-center text-[#4B4B4B]"
        style={{ paddingTop: "32px", paddingRight: "20px", paddingBottom: "32px", paddingLeft: "20px" }}
        onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside modal
      >
        {/* Image */}
        <img
          src={mediaData.Popup}
          alt="Modal"
          className="w-[155px] h-[150px] object-cover"
        />

        {/* Heading with gradient text */}
        <h2
          className="text-center text-[24px] font-montserrat font-semibold leading-[28px] tracking-[0%] bg-gradient-to-r from-[#144E5A] to-[#1E6B78] bg-clip-text text-transparent"
        >
          {heading}
        </h2>

        {/* Subheading */}
        <p
          className="text-center text-[16px] font-montserrat font-normal leading-[24px] mt-1 mb-4"
        >
          {subheading}
        </p>
      </div>
    </div>
  );
};
