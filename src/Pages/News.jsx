import { useEffect, useState } from "react";
import { mediaData } from "../utils/mediaData";
import { Customcard } from "../components/Customcard";
import { Imagemodal } from "../components/Imagemodal";
import { Search } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { apiRequest } from "../auth/api";
import { toast } from "sonner";
import { CustomToast } from "../components/CustomToast";

export const News = ({ variant = "page" }) => {
  const auth = useAuth();
  const role = auth.user?.role;
  const canManageNews = role === "director" || role === "principal";
  const [showForm, setShowForm] = useState(false);
  const [newsList, setNewsList] = useState([]);
  const [newsTitle, setNewsTitle] = useState("");
  const [newsDesc, setNewsDesc] = useState("");
  const [showImageModal, setShowImageModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [selectedNewsId, setSelectedNewsId] = useState(null);
  const [modalHeading, setModalHeading] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCancelDiscard, setIsCancelDiscard] = useState(false);

  useEffect(() => {
    if (!auth.token) return;
    apiRequest("/content/news", { token: auth.token })
      .then((data) => {
        const items = (data.items || []).map((i) => ({
          id: i.id,
          created_at: i.created_at,
          updated_at: i.updated_at,
          creator_email: i.creator_email,
          ...(i.data || {}),
        }));
        setNewsList(items);
      })
      .catch(() => {});
  }, [auth.token]);

  // Open delete confirmation
  const handleDeleteClick = (item) => {
    setSelectedNewsId(item?.id ?? null);
    setIsCancelDiscard(false);
    setShowDiscardModal(true);
  };

  // Open cancel/discard confirmation
  const handleCancelClick = () => {
    setIsCancelDiscard(true);
    setShowDiscardModal(true);
  };

  // Confirm delete or discard
  const handleConfirmDiscard = () => {
    if (isCancelDiscard) {
      setShowForm(false);
      setNewsTitle("");
      setNewsDesc("");
      setIsEditing(false);
      setSelectedNewsId(null);
    } else if (selectedNewsId !== null) {
      const id = selectedNewsId;
      if (canManageNews) {
        apiRequest(`/content/news/${id}`, {
          method: "DELETE",
          token: auth.token,
        }).catch(() => {});
      }
      setNewsList((prev) => prev.filter((n) => n.id !== id));
      setSelectedNewsId(null);
    }
    setShowDiscardModal(false);
  };

  // Create or update news
  const handleCreateNews = async () => {
    if (!canManageNews) return;
    if (!newsTitle.trim() || !newsDesc.trim()) return;

    try {
      if (isEditing && selectedNewsId !== null) {
        const updated = await apiRequest(`/content/news/${selectedNewsId}`, {
          method: "PUT",
          token: auth.token,
          body: { title: newsTitle, desc: newsDesc },
        });
        setNewsList((prev) =>
          prev.map((n) =>
            n.id === updated.item.id
              ? {
                  id: updated.item.id,
                  created_at: updated.item.created_at,
                  updated_at: updated.item.updated_at,
                  creator_email: n.creator_email, // Preserve existing creator email on update
                  ...(updated.item.data || {}),
                }
              : n
          )
        );
        setIsEditing(false);
        setSelectedNewsId(null);
        setShowForm(false);
        setModalHeading("News Updated");
      } else {
        const created = await apiRequest("/content/news", {
          method: "POST",
          token: auth.token,
          body: { title: newsTitle, desc: newsDesc },
        });
        setNewsList((prev) => [
          {
            id: created.item.id,
            created_at: created.item.created_at,
            updated_at: created.item.updated_at,
            creator_email: auth.user?.email, // Use current user email for new items
            ...(created.item.data || {}),
          },
          ...prev,
        ]);
        setShowForm(false);
        setModalHeading("News Created");
      }
    } catch (e) {
      toast.custom((t) => <CustomToast id={t} message={e?.message || "Failed to save news"} type="error" />);
    }

    setNewsTitle("");
    setNewsDesc("");
    setShowImageModal(true);
  };

  // Edit news
  const handleEditClick = (item) => {
    if (!canManageNews) return;
    setIsEditing(true);
    setSelectedNewsId(item.id);
    setNewsTitle(item.title);
    setNewsDesc(item.desc);
    setShowForm(true);
  };

  // Filter news by search query
  const filteredNews = newsList.filter((item) =>
    (item.title || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const visibleNews = filteredNews;

  const formatDateTime = (isoString) => {
    if (!isoString) return "";
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className={`flex flex-col gap-5 rounded-3xl h-full border-[#FAFAFA]`}>
      <div className="flex gap-6 flex-wrap relative z-10">
        <div className="bg-white rounded-[16px] p-2 sm:p-4 flex-[1_1_60%] flex flex-col gap-6 border min-w-0">
          {/* Heading + Button */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center h-auto sm:h-[60px] border-b pb-2 sm:pb-0 gap-4 sm:gap-0 rounded-t-[16px]">
            <h2 className="text-black font-montserrat font-semibold text-[20px] mb-2 sm:mb-0">
              {showForm
                ? isEditing
                  ? "Edit News"
                  : "Create News"
                : variant === "dashboard"
                ? "News & Updates"
                : "Updates List"}
            </h2>

            {!showForm && canManageNews ? (
              <button
                className="flex items-center justify-center gap-1 bg-pink text-white rounded-[22px] px-6 py-3 text-[18px] font-semibold shadow-md hover:shadow-lg transition-all w-full sm:w-auto"
                style={{ boxShadow: "0px 4px 6px rgba(0,0,0,0.25)" }}
                onClick={() => {
                  setShowForm(true);
                  setIsEditing(false);
                  setNewsTitle("");
                  setNewsDesc("");
                  setSelectedNewsId(null);
                }}
              >
                <span className="text-[22px] font-bold leading-none mt-[-2px]">+</span>
                <span className="font-montserrat font-semibold text-[16px] leading-none">
                  Create News
                </span>
              </button>
            ) : null}
          </div>

          {/* Search bar (hidden in dashboard variant) */}
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
                  className="w-full rounded-lg placeholder-grey bg-gray-200 pl-10 pr-3 py-2 text-black font-nunito focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* News List */}
          {!showForm ? (
            filteredNews.length === 0 ? (
              <div className="flex justify-center">
                <div className="bg-white rounded-[10px] w-full max-w-full h-[271px] flex items-center justify-center">
                  <div className="flex flex-col items-center justify-center gap-[16px]">
                    <img
                      src={mediaData.Nomeeting}
                      alt="content"
                      className="w-[140px] h-[140px] object-cover rounded"
                    />
                    <h3 className="font-montserrat font-semibold text-[18px] text-black text-center">
                      No Updates Yet...
                    </h3>
                    <p className="font-montserrat font-normal text-[14px] text-center text-grey">
                      Updates posted by management will appear here.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-4">
                  {visibleNews.map((item) => (
                    <div
                      key={item.id}
                      className="w-full bg-white rounded-[10px] shadow-[0_0_4px_0_#00000040] p-2 sm:p-4 flex flex-col gap-3"
                    >
                      {/* Row 1: Profile + Posted by + Icons */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img
                            src={mediaData.Man1}
                            alt="profile"
                            className="w-[40px] h-[40px] rounded-full object-cover"
                          />
                          <p className="text-sm font-montserrat text-grey">
                            Posted by {item.creator_email || "Unknown"}
                          </p>
                        </div>
                        {canManageNews ? (
                          <div className="flex items-center gap-4">
                            <img
                              src={mediaData.Recycle}
                              alt="recycle"
                              className="w-6 h-6 cursor-pointer"
                              onClick={() => handleDeleteClick(item)}
                            />
                            <img
                              src={mediaData.Edit}
                              alt="edit"
                              className="w-6 h-6 cursor-pointer"
                              onClick={() => handleEditClick(item)}
                            />
                          </div>
                        ) : null}
                      </div>

                      <h3 className="font-montserrat font-semibold text-lg text-primary">
                        {item.title}
                      </h3>
                      <p className="font-montserrat text-sm text-black">{item.desc}</p>
                      <div className="flex justify-end">
                        <p className="text-xs font-montserrat text-grey">
                          {item.created_at ? `Posted on: ${formatDateTime(item.created_at)}` : null}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                
              </>
            )
          ) : (
            // News Form
            <div className="rounded-[10px] shadow-[0_0_4px_0_#00000040] w-full max-w-full p-4 sm:p-6 flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                <label className="font-montserrat font-semibold text-[16px] text-grey w-full sm:w-[120px]">
                  News Title
                </label>
                <input
                  type="text"
                  value={newsTitle}
                  onChange={(e) => setNewsTitle(e.target.value)}
                  className="w-full sm:flex-1 border rounded-[8px] px-3 py-2 text-[14px] font-montserrat outline-none bg-[#F1F1F1] text-black"
                  placeholder="News title"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-start gap-2 sm:gap-4">
                <label className="font-montserrat font-semibold text-[16px] text-grey w-full sm:w-[120px] mt-0 sm:mt-2">
                  Description
                </label>
                <textarea
                  rows="7"
                  value={newsDesc}
                  onChange={(e) => setNewsDesc(e.target.value)}
                  className="w-full sm:flex-1 border rounded-[8px] px-3 py-2 text-[14px] font-montserrat outline-none resize-none bg-[#F1F1F1] text-black"
                  placeholder="Type Here..."
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
                <button
                  className="bg-gray-400 text-white w-full sm:w-auto px-0 sm:px-[80px] py-2 rounded-3xl font-montserrat font-semibold"
                  onClick={handleCancelClick}
                >
                  Cancel
                </button>

                <button
                  className="bg-primary text-white w-full sm:w-auto px-0 sm:px-[70px] py-2 rounded-3xl font-montserrat font-semibold"
                  onClick={handleCreateNews}
                >
                  {isEditing ? "Update News" : "Create News"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && (
        <Imagemodal
          heading={modalHeading}
          subheading="Your update has been saved."
          onClose={() => setShowImageModal(false)}
        />
      )}

      {/* Discard / Delete Modal */}
      {showDiscardModal && (
        <Customcard
          heading={isCancelDiscard ? "Discard News" : "Delete News"}
          content={
            <div>
              {isCancelDiscard
                ? "Are you sure you want to discard the News? This action cannot be undone."
                : "Are you sure you want to delete this news? This action cannot be undone."}
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
              <span>Yes, {isCancelDiscard ? "Discard" : "Delete"}</span>
            </div>
          }
          button1Bg="bg-gray-400"
          button2Bg={isCancelDiscard ? "bg-primary" : "bg-[#E30000]"}
          onButton1Click={() => setShowDiscardModal(false)}
          onButton2Click={handleConfirmDiscard}
        />
      )}
    </div>
  );
};
