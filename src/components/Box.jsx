import { ArrowRight } from "lucide-react"; // Arrow icon

export const Box = ({ 
  imageSrc, 
  heading, 
  subheading, 
  onClick 
}) => {
  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between w-[325px] h-[96px] bg-white rounded-[16px] p-[24px_16px] gap-8 cursor-pointer shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Left section: Image + Text */}
      <div className="flex items-center gap-1">
        {/* Image */}
        <div className=" rounded-[8px] p-[10px]  flex items-center justify-center">
          <img src={imageSrc} alt="icon" className="w-[44px] h-[44px] object-cover rounded-[8px]" />
        </div>

        {/* Text */}
        <div className="flex flex-col">
          <h3 className="text-black font-montserrat font-semibold text-[18px] leading-[100%]">
            {heading}
          </h3>
          <p className="text-gray-600 font-montserrat font-normal text-[16px] leading-[24px]">
            {subheading}
          </p>
        </div>
      </div>

      {/* Arrow pointing toward left corner */}
      <ArrowRight 
        size={24} 
        className="text-gray-400" 
        style={{ transform: "rotate(-30deg)" }} 
      />
    </div>
  );
};
