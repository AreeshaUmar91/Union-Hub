import React, { useState, useEffect } from "react";
import { mediaData } from "../utils/mediaData";
import { toast } from "sonner";
import { CustomToast } from "../components/CustomToast";

export const Bigformcard = ({ initialData, onCreate, onCancel }) => {
  const [title, setTitle] = useState("");
  const [venue, setVenue] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [instructions, setInstructions] = useState("");

  // Populate form when editing
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setVenue(initialData.venue || "");
      setDate(initialData.date || "");
      setStartTime(initialData.startTime || "");
      setEndTime(initialData.endTime || "");
      setInstructions(initialData.instructions || "");
    }
  }, [initialData]);

  const handleSubmit = () => {
    if (!title || !venue || !date || !startTime || !endTime) {
      toast.custom((t) => <CustomToast id={t} message="Please fill all required fields" type="error" />);
      return;
    }
    // Pass action type to parent
    onCreate(
      { title, venue, date, startTime, endTime, instructions },
      initialData ? "update" : "create"
    );
  };

  return (
    <div className="bg-white rounded-[20px] p-2 sm:p-6 flex flex-col gap-6 w-full">
      <h2 className="font-montserrat text-[24px] font-semibold text-black">
        {initialData ? "Edit Meetings" : "Create Meetings"}
      </h2>
      <div className="border-b border-gray-300"></div>

      <div
        className="bg-white rounded-[16px] p-3 sm:p-6 flex flex-col gap-6"
        style={{ boxShadow: "0 0 15px rgba(0,0,0,0.25)" }}
      >
        {/* Meeting Title */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-4 min-w-[150px]">
            <img src={mediaData.Tag} alt="icon" className="w-6 h-6" />
            <label className="font-montserrat font-medium text-[16px] text-grey">
              Meeting Title
            </label>
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter Meeting Title"
            className="w-full flex-1 rounded-lg px-3 py-2 bg-[#F1F1F1] text-black placeholder-grey focus:outline-none"
          />
        </div>

        {/* Venue */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-4 min-w-[150px]">
            <img src={mediaData.Venue} alt="icon" className="w-6 h-6" />
            <label className="font-montserrat font-medium text-[16px] text-grey">
              Venue
            </label>
          </div>
          <input
            type="text"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            placeholder="St#1 sample avenue ground floor"
            className="w-full flex-1 rounded-lg px-3 py-2 bg-[#F1F1F1] text-black focus:outline-none"
          />
        </div>

        {/* Date & Time */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-4 min-w-[150px] mt-2">
            <img src={mediaData.Timer} alt="icon" className="w-6 h-6" />
            <label className="font-montserrat font-medium text-[16px] text-grey">
              Date & Time
            </label>
          </div>
          
          <div className="flex flex-wrap gap-4 flex-1">
            <input
              type="date"
              value={date}
              min={!initialData ? new Date().toISOString().split("T")[0] : undefined}
              onChange={(e) => setDate(e.target.value)}
              className={`w-full sm:w-[320px] rounded-lg bg-[#F1F1F1] px-3 py-2 focus:outline-none ${
                date ? "text-black" : "text-gray-400"
              }`}
            />

            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className={`w-[calc(50%-8px)] sm:w-[175px] rounded-lg bg-[#F1F1F1] px-3 py-2 focus:outline-none ${
                startTime ? "text-black" : "text-gray-400"
              }`}
            />

            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className={`w-[calc(50%-8px)] sm:w-[175px] rounded-lg bg-[#F1F1F1] px-3 py-2 focus:outline-none ${
                endTime ? "text-black" : "text-gray-400"
              }`}
            />
          </div>
        </div>

        {/* Description */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-4 min-w-[150px] mt-2">
            <img src={mediaData.Message} alt="icon" className="w-6 h-6" />
            <label className="font-montserrat font-medium text-[16px] text-grey">
              Description
            </label>
          </div>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Type Here..."
            rows={4}
            className="w-full flex-1 rounded-lg px-3 py-2 bg-[#F1F1F1] text-black resize-none focus:outline-none"
          />
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-4 sm:gap-6 mt-auto">
          <button
            onClick={onCancel}
            className="w-full sm:w-[200px] h-[44px] rounded-full bg-grey text-white font-semibold font-montserrat"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="w-full sm:w-[200px] h-[44px] rounded-full bg-primary text-white font-semibold font-montserrat"
          >
            {initialData ? "Update Meeting" : "Create Meeting"}
          </button>
        </div>
      </div>
    </div>
  );
};
