import React, { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { mediaData } from "../utils/mediaData";
import { Bigformcard } from "../components/Bigformcard";
import { Customcard } from "../components/Customcard";
import { Imagemodal } from "../components/Imagemodal";
import { useAuth } from "../auth/AuthContext";
import { apiRequest } from "../auth/api";

export const Meetings = ({ variant = "page" }) => {
  const auth = useAuth();
  const role = auth.user?.role;
  const canManageMeetings = role === "director" || role === "principal";
  const [showForm, setShowForm] = useState(false);
  const [meetingData, setMeetingData] = useState([]); 
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalActionType, setModalActionType] = useState(""); 
  const [selectedMeetingId, setSelectedMeetingId] = useState(null); 
  const [showCustomCard, setShowCustomCard] = useState(false); 
  const headerColors = ["#05B9B926", "#FF8A1426", "#9B05B926", "#007FFF26"];

  useEffect(() => {
    if (!auth.token) return;
    apiRequest("/content/meetings", { token: auth.token })
      .then((data) => {
        const items = (data.items || []).map((i) => ({ id: i.id, ...(i.data || {}) }));
        setMeetingData(items);
      })
      .catch(() => {});
  }, [auth.token]);

  const handleCreateOrUpdateMeeting = async (data, actionType) => {
    if (!canManageMeetings) return;

    try {
      if (actionType === "update" && selectedMeetingId !== null) {
        const updated = await apiRequest(`/content/meetings/${selectedMeetingId}`, {
          method: "PUT",
          token: auth.token,
          body: data,
        });
        setMeetingData((prev) =>
          prev.map((m) => (m.id === updated.item.id ? { id: updated.item.id, ...(updated.item.data || {}) } : m))
        );
      } else {
        const created = await apiRequest("/content/meetings", {
          method: "POST",
          token: auth.token,
          body: data,
        });
        setMeetingData((prev) => [{ id: created.item.id, ...(created.item.data || {}) }, ...prev]);
      }
      setShowForm(false);
      setModalActionType(actionType);
      setShowImageModal(true);
    } catch (e) {
      toast.custom((t) => <CustomToast id={t} message={e?.message || "Failed to save meeting"} type="error" />);
    }
  };

  const handleDeleteMeeting = (id) => {
    setSelectedMeetingId(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedMeetingId) return;
    try {
      await apiRequest(`/content/meetings/${selectedMeetingId}`, {
        method: "DELETE",
        token: auth.token,
      });
      setMeetingData((prev) => prev.filter((m) => m.id !== selectedMeetingId));
      setModalActionType("delete");
      setShowImageModal(true);
    } catch (e) {
      toast.custom((t) => <CustomToast id={t} message={e?.message || "Failed to delete meeting"} type="error" />);
    } finally {
      setShowDeleteModal(false);
      setSelectedMeetingId(null);
    }
  };

  const handleEditMeeting = (id) => {
    setSelectedMeetingId(id);
    setShowForm(true);
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    const [hour, minute] = timeStr.split(":");
    const date = new Date();
    date.setHours(hour, minute);
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  const filteredMeetings = searchQuery
    ? meetingData.filter((m) =>
        (m.title || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : meetingData;

  const headingText = variant === "dashboard" ? "Meetings" : "Meetings List";

  const displayedMeetings = filteredMeetings;

  const selectedMeeting =
    selectedMeetingId !== null ? meetingData.find((m) => m.id === selectedMeetingId) : null;

  return (
    <div 
      className={`flex flex-col gap-6 rounded-3xl h-full  bg-[#FAFAFA] `}
    >
      <div className="flex flex-col md:flex-row gap-6 flex-wrap">
        <div className="bg-white rounded-[16px] p-2 sm:p-4 flex-1 md:flex-[1_1_60%] flex flex-col gap-6 border min-w-0">
          
          {/* Header + New Meeting Button */}
          {!showForm && (
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center h-auto sm:h-[60px] pb-4 sm:pb-0 gap-4 sm:gap-0 border-b">
              <h2 className={`text-black font-montserrat font-semibold text-[20px]`}>
                {headingText}
              </h2>
              {canManageMeetings ? (
                <button
                  className="flex items-center justify-center gap-1 bg-pink text-white rounded-[22px] px-6 py-3 shadow-md hover:shadow-lg transition-all w-full sm:w-auto"
                  style={{ boxShadow: "0px 4px 6px rgba(0,0,0,0.25)" }}
                  onClick={() => {
                    setSelectedMeetingId(null);
                    setShowForm(true);
                  }}
                >
                  <span className="text-[22px] font-bold leading-none mt-[-2px]">+</span>
                  <span className="font-montserrat font-semibold text-[16px] leading-none">
                    New Meeting
                  </span>
                </button>
              ) : null}
            </div>
          )}

          {/* Search Bar */}
          {!showForm && variant !== "dashboard" && (
            <div className="w-full mb-4">
              <div className="relative w-full">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-grey">
                  <Search className="w-5 h-5 text-grey" />
                </span>
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg placeholder-grey  bg-gray-200 px-10 py-2 text-black font-nunito focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Create / Edit Form */}
          {showForm && canManageMeetings ? (
            <Bigformcard
              heading={selectedMeetingId !== null ? "Edit Meetings" : "Create Meetings"}
              onCreate={handleCreateOrUpdateMeeting}
              onCancel={() => setShowCustomCard(true)}
              initialData={selectedMeeting}
            />
          ) : null}

          {/* Meeting Cards or Empty State */}
          {!showForm && meetingData.length > 0 ? (
            <>
              <div className={`flex flex-wrap gap-4 ${variant === "dashboard" ? "flex-col" : ""}`}>
                {displayedMeetings.map((meeting, idx) => {
                  const headerColor = headerColors[idx % headerColors.length];
                  return (
                    <div
                      key={meeting.id ?? idx}
                      className={`${
                        variant === "dashboard" ? "w-full" : "w-full sm:w-[calc(50%-8px)]"
                      } min-h-[326px] h-auto rounded-[10px] p-[15px] flex flex-col gap-[14px]`}
                      style={{ background: "#fff", boxShadow: "0px 4px 10px rgba(0,0,0,0.1)" }}
                    >
                      {/* Card Header */}
                      <div
                        className="w-full h-[50px] flex items-center justify-between px-3 rounded-md"
                        style={{ background: headerColor, borderLeft: `4px solid ${headerColor}` }}
                      >
                        <h3 className="text-black font-semibold text-[16px]">{meeting.title}</h3>
                        {canManageMeetings ? (
                          <div className="flex gap-3">
                            <img
                              src={mediaData.Recycle}
                              alt="recycle"
                              className="w-5 h-5 cursor-pointer"
                              onClick={() => handleDeleteMeeting(meeting.id)}
                            />
                            <img
                              src={mediaData.Edit}
                              alt="edit"
                              className="w-5 h-5 cursor-pointer"
                              onClick={() => handleEditMeeting(meeting.id)}
                            />
                          </div>
                        ) : null}
                      </div>

                      {/* Card Body */}
                      <div className="flex flex-col gap-4 px-2">
                        <div className="flex flex-col gap-1">
                          <p className="font-semibold text-[14px] text-grey">Meeting Venue:</p>
                          <div className="flex items-center gap-2">
                            <img src={mediaData.Location} alt="venue" className="w-5 h-5" />
                            <p className="text-black text-[16px] font-semibold">{meeting.venue}</p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <p className="font-semibold text-[14px] text-grey">Meeting Time:</p>
                          <div className="flex items-center gap-2">
                            <img src={mediaData.Clock} alt="clock" className="w-5 h-5" />
                            <p className="text-black font-semibold text-[16px]">
                              {new Date(meeting.date).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}{" "}
                              {formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <p className="font-semibold text-[16px] text-grey">Meeting Instructions:</p>
                          <ul className="space-y-1 text-black font-montserrat text-[16px]">
                            {meeting.instructions
                              ?.split("\n")
                              .filter((line) => line.trim() !== "")
                              .map((line, idx2) => (
                                <li
                                  key={idx2}
                                  className="relative pl-4 before:content-['•'] before:absolute before:left-0 before:top-1 before:text-grey before:text-[12px] before:font-normal"
                                >
                                  {line}
                                </li>
                              ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </>
          ) : !showForm ? (
            // Empty state when no meetings
            <div className="flex justify-center items-center h-[271px] bg-white rounded-[10px]">
              <div className="flex flex-col items-center gap-[16px]">
                <img
                  src={mediaData.Nomeeting}
                  alt="no meetings"
                  className="w-[140px] h-[140px] object-cover rounded"
                />
                <h3 className="font-montserrat font-semibold text-[18px] text-black text-center">
                  No Upcoming Meetings Yet...
                </h3>
                <p className="font-montserrat font-normal text-grey text-[14px] text-center">
                  {canManageMeetings
                    ? "Create a meeting so employees can view it here."
                    : "No meetings have been posted yet."}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <Customcard
          heading="Delete Meeting"
          content={
            <div>
              Are you sure you want to delete this meeting? <br />
              This action cannot be undone.
            </div>
          }
          button1Text={
            <div className="flex items-center justify-center gap-2">
              <img src={mediaData.Cancel} alt="cancel" className="w-5 h-5" />
              <span>No, Cancel</span>
            </div>
          }
          button2Text={
            <div className="flex items-center justify-center gap-2">
              <img src={mediaData.Trash} alt="delete" className="w-5 h-5" />
              <span>Yes, Delete</span>
            </div>
          }
          button1Bg="bg-gray-400"
          button2Bg="bg-[#E30000]"
          onButton1Click={() => setShowDeleteModal(false)}
          onButton2Click={handleConfirmDelete}
          onClose={() => setShowDeleteModal(false)}
        />
      )}

      {/* Form Cancel Discard Modal */}
      {showCustomCard && (
        <Customcard
          heading="Discard Meeting"
          content="Discard changes and leave the form?"
          button1Text="Cancel"
          button2Text="Discard"
          button1Bg="bg-grey"
          button2Bg="bg-primary"
          onButton1Click={() => setShowCustomCard(false)}
          onButton2Click={() => {
            setShowForm(false);
            setShowCustomCard(false);
          }}
        />
      )}

      {/* Image Modal for Create/Update Confirmation */}
      {showImageModal && (
        <Imagemodal
          heading={
            modalActionType === "delete"
              ? "Meeting Deleted"
              : modalActionType === "update"
                ? "Meeting Updated"
                : "Meeting Created"
          }
          subheading={
            modalActionType === "delete"
              ? "The meeting has been deleted."
              : modalActionType === "update"
                ? "The meeting has been updated."
                : "The meeting has been created."
          }
          onClose={() => setShowImageModal(false)}
        />
      )}

      {/* Search No Match Placeholder */}
      {!showForm && searchQuery && filteredMeetings.length === 0 && (
        <div className="flex justify-center items-center h-[271px] bg-white rounded-[10px]">
          <div className="flex flex-col items-center gap-[16px]">
            <img
              src={mediaData.Noresult}
              alt="no match"
              className="w-[140px] h-[140px] object-cover rounded"
            />
            <h3 className="font-montserrat font-semibold text-[18px] text-black text-center">
              No Results Found...
            </h3>
            <p className="font-montserrat font-normal text-grey text-[14px] text-center">
              Try a different search term.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
