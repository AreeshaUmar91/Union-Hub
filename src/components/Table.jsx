import React, { useState } from "react";

export function Table({ 
  title, 
  buttonText, 
  onButtonClick, 
  columns, 
  data = [], 
  onEditClick, 
  onCircleClick, // ✅ add this prop
  onActionClick,
  emptyState, // ✅ add this prop
}) {
  const [search, setSearch] = useState("");

  // Filtering logic
  const filteredData = data.filter((row) =>
    columns.some((col) => {
      const cell = row[col.key]?.value;
      return typeof cell === "string" && cell.toLowerCase().includes(search.toLowerCase());
    })
  );

  return (
    <div className="p-4 sm:p-6 bg-white shadow rounded-[20px] border-t-8" style={{ borderColor: "#FAFAFA" }}>
      {/* Heading + Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 border-b border-gray-300 mb-5 gap-4 sm:gap-0">
        <h2 className="text-2xl font-montserrat font-semibold text-black">{title}</h2>
        {onButtonClick && (
          <button
            onClick={onButtonClick}
            style={{ boxShadow: "0px 4px 6px rgba(0,0,0,0.25)" }}
            className="flex items-center justify-center gap-2 bg-pink text-white rounded-[30px] w-full sm:w-auto px-6 py-2 hover:bg-pink/90 transition shadow"
          >
            <span className="text-[22px] font-bold leading-none mt-[-2px]">+</span>
            <span className="font-montserrat font-semibold text-[18px]">{buttonText}</span>
          </button>
        )}
      </div>

      {/* Search */}
      <div className="mb-5 relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search"
          className="w-full font-nunito placeholder-grey  text-black  bg-[#F1F1F1] rounded-xl px-10 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        {/* Search Icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-grey absolute left-3 top-1/2 transform -translate-y-1/2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1110.5 3a7.5 7.5 0 016.15 13.65z"
          />
        </svg>
      </div>

      {/* Table or Empty State */}
      {filteredData.length === 0 && emptyState ? (
        <div className="mt-5">{emptyState}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th 
                  key={idx} 
                  className="px-4 py-2 text-left font-semibold border-b font-montserrat text-[18px] text-black whitespace-nowrap"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50 transition ">
                {columns.map((col, cidx) => (
                  <td 
                    key={cidx} 
                    className="border-b px-4 pt-4 pb-1 text-[14px] font-montserrat text-black whitespace-nowrap"
                  >
                    {row[col.key]?.type === "user" ? (
                      <div className="flex items-center gap-2">
                        <img
                          src={row[col.key].image}
                          alt="Profile"
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <span>{row[col.key].value}</span>
                      </div>
                    ) : row[col.key]?.type === "image" ? (
                      Array.isArray(row[col.key].value) ? (
                        <div className="flex gap-4">
                        {row[col.key].value.map((imgSrc, i) => (
                          <img
                            key={i}
                            src={imgSrc}
                            alt="icon"
                            className="w-6 h-6 object-contain cursor-pointer"
                            onClick={() => {
                              if (onActionClick) {
                                onActionClick(row, i);
                                return;
                              }
                              if (i === 0 && onCircleClick) {
                                // ✅ first icon = Circle
                                onCircleClick(row);
                              }
                              if (i === 1 && onEditClick) {
                                // ✅ second icon = Edit
                                onEditClick(row);
                              }
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <img
                        src={row[col.key].value}
                        alt="img"
                        className={`w-12 h-12 object-contain rounded ${row[col.key].onClick ? 'cursor-pointer' : ''}`}
                        onClick={row[col.key].onClick}
                      />
                    )
                  ) : (
                    row[col.key]?.value
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      )}
    </div>
  );
}
