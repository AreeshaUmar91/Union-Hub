import { useEffect, useState } from "react";
import { mediaData } from "../utils/mediaData";
import { Search, ChevronDown, ChevronUp } from "lucide-react";
import { Customcard } from "../components/Customcard";
import { Imagemodal } from "../components/Imagemodal";
import { useAuth } from "../auth/AuthContext";
import { apiRequest } from "../auth/api";

export const Faq = () => {
  const auth = useAuth();
  const role = auth.user?.role;
  const canManageFaq = role === "director";
  const [showForm, setShowForm] = useState(false);
  const [faqTitle, setFaqTitle] = useState("");
  const [faqDescription, setFaqDescription] = useState("");
  const [faqs, setFaqs] = useState([]);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedFaqId, setSelectedFaqId] = useState(null);
  const [deleteTitle, setDeleteTitle] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [modalType, setModalType] = useState("create"); // "create" or "update"
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!auth.token) return;
    apiRequest("/content/faqs", { token: auth.token })
      .then((data) => {
        const items = (data.items || []).map((i) => ({
          id: i.id,
          created_at: i.created_at,
          updated_at: i.updated_at,
          ...(i.data || {}),
        }));
        setFaqs(items);
      })
      .catch(() => {});
  }, [auth.token]);

  const resetForm = () => {
    setFaqTitle("");
    setFaqDescription("");
    setIsEditing(false);
    setSelectedFaqId(null);
  };

  const handleCreateFaq = async () => {
    if (!canManageFaq) return;
    if (!faqTitle.trim() || !faqDescription.trim()) {
      toast.custom((t) => <CustomToast id={t} message="Please fill in both fields" type="error" />);
      return;
    }

    try {
      if (isEditing && selectedFaqId !== null) {
        const updated = await apiRequest(`/content/faqs/${selectedFaqId}`, {
          method: "PUT",
          token: auth.token,
          body: { title: faqTitle, description: faqDescription },
        });
        setFaqs((prev) =>
          prev.map((f) =>
            f.id === updated.item.id
              ? {
                  id: updated.item.id,
                  created_at: updated.item.created_at,
                  updated_at: updated.item.updated_at,
                  ...(updated.item.data || {}),
                }
              : f
          )
        );
        setModalType("update");
      } else {
        const created = await apiRequest("/content/faqs", {
          method: "POST",
          token: auth.token,
          body: { title: faqTitle, description: faqDescription },
        });
        setFaqs((prev) => [
          {
            id: created.item.id,
            created_at: created.item.created_at,
            updated_at: created.item.updated_at,
            ...(created.item.data || {}),
          },
          ...prev,
        ]);
        setModalType("create");
      }
      setShowForm(false);
      resetForm();
      setShowSuccessModal(true);
    } catch (e) {
      toast.custom((t) => <CustomToast id={t} message={e?.message || "Failed to save FAQ"} type="error" />);
    }
  };

  const handleCancel = () => {
    setShowDiscardModal(true);
  };

  const discardFaq = () => {
    setShowForm(false);
    resetForm();
    setShowDiscardModal(false);
  };

  const handleDeleteClick = (faq) => {
    if (!canManageFaq) return;
    setSelectedFaqId(faq?.id ?? null);
    setDeleteTitle(faq?.title ?? null);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!canManageFaq) return;
    if (selectedFaqId === null) {
      setShowDeleteModal(false);
      return;
    }

    try {
      await apiRequest(`/content/faqs/${selectedFaqId}`, {
        method: "DELETE",
        token: auth.token,
      });
      setFaqs((prev) => prev.filter((f) => f.id !== selectedFaqId));
      setModalType("delete");
      setShowSuccessModal(true);
    } catch (e) {
      toast.custom((t) => <CustomToast id={t} message={e?.message || "Failed to delete FAQ"} type="error" />);
    } finally {
      setShowDeleteModal(false);
      setSelectedFaqId(null);
      setExpandedFaq(null);
    }
  };

  const handleEdit = (faq) => {
    if (!canManageFaq) return;
    if (!faq?.id) return;
    setFaqTitle(faq.title || "");
    setFaqDescription(faq.description || "");
    setIsEditing(true);
    setSelectedFaqId(faq.id);
    setShowForm(true);
  };

  const toggleExpand = (id) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  const filteredFaqs = faqs.filter((f) => {
    const q = searchTerm.toLowerCase();
    return (
      String(f.title || "").toLowerCase().includes(q) ||
      String(f.description || "").toLowerCase().includes(q)
    );
  });

  return (
  <div
      className={`flex flex-col gap-6 rounded-3xl h-full  `}
    
    >




      <div className="flex gap-6 flex-wrap">
        <div className="bg-white rounded-[16px] p-4 w-full flex flex-col gap-6 border min-w-0">

          {/* If not showing form */}
          {!showForm ? (
            <>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center h-auto sm:h-[60px] border-b pb-4 sm:pb-0 gap-4 sm:gap-0">
                <h2 className="text-black font-semibold text-[20px]">FAQ’s</h2>
                {canManageFaq ? (
                  <button
                    onClick={() => {
                      setShowForm(true);
                      resetForm();
                    }}
                    className="flex items-center justify-center gap-2 bg-pink text-white rounded-[22px] w-full sm:w-auto px-6 py-[10px] shadow-md"
                    style={{ boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.25)" }}
                  >
                    <span className="flex items-center gap-2 font-montserrat font-semibold text-[16px] leading-none">
                      <span className="text-[24px] leading-none">+</span>
                      Create FAQ’s
                    </span>
                  </button>
                ) : null}
              </div>

              <div className="w-full mb-4 mt-4 sm:mt-0">
                <div className="relative w-full">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-black">
                    <Search className="w-5 h-5 text-grey" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-lg bg-gray-200 px-10 py-2 text-black placeholder-grey  focus:outline-none"
                  />
                </div>
              </div>


              {/* FAQ List */}
              {faqs.length === 0 ? (
                <div className="flex justify-center font-montserrat">
                  <div className="bg-white rounded-[10px] w-full max-w-full h-[271px] flex items-center justify-center">
                    <div className="flex flex-col items-center justify-center gap-[16px]">
                      <img
                        src={mediaData.Nomeeting}
                        alt="content"
                        className="w-[140px] h-[140px] object-cover rounded"
                      />
                      <h3 className="font-semibold text-[18px] text-black text-center">
                        No Data Available Yet...
                      </h3>
                      <p className="font-normal text-[14px] text-center text-grey">
                        Create an FAQ so employees can find answers quickly.
                      </p>
                    </div>
                  </div>
                </div>
              ) : filteredFaqs.length === 0 ? (
                <div className="text-center text-grey mt-6 italic">No results found.</div>
              ) : (
                <div className="flex flex-col gap-4">
                  {filteredFaqs.map((faq) => (
                    <div key={faq.id} className=" rounded-lg p-4 bg-white ">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 sm:gap-0">
                        <div className="text-black font-semibold text-[16px]">
                          {faq.title}
                        </div>
                        <div className="flex items-center justify-end gap-3 w-full sm:w-auto">
                          {canManageFaq ? (
                            <>
                              <img
                                src={mediaData.Recycle}
                                alt="delete"
                                className="w-5 h-5 cursor-pointer"
                                onClick={() => handleDeleteClick(faq)}
                              />
                              <img
                                src={mediaData.Edit}
                                alt="edit"
                                className="w-5 h-5 cursor-pointer"
                                onClick={() => handleEdit(faq)}
                              />
                            </>
                          ) : null}
                          {expandedFaq === faq.id ? (
                            <ChevronUp
                              className="cursor-pointer"
                              onClick={() => toggleExpand(faq.id)}
                            />
                          ) : (
                            <ChevronDown
                              className="cursor-pointer"
                              onClick={() => toggleExpand(faq.id)}
                            />
                          )}
                        </div>
                      </div>

                      {expandedFaq === faq.id && (
                        <div className="mt-3 bg-[#F1F1F1] rounded-lg p-3 text-grey text-[14px]">
                          {faq.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            // Form for Create/Edit
            <div className="flex flex-col gap-4">
              <div className="border-b pb-2">
                <h2 className="text-black font-semibold text-[20px]">
                  {isEditing ? "Edit FAQ’s" : "Create FAQ’s"}
                </h2>
              </div>

              <div
                className="bg-white rounded-[10px] p-4 sm:p-6 flex flex-col gap-6"
                style={{ boxShadow: "0px 0px 4px 0px rgba(0,0,0,0.25)" }}
              >
                {/* Title */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <label className="font-semibold text-[16px] text-grey w-full sm:w-[150px]">
                    FAQ Title
                  </label>
                  <input
                    type="text"
                    value={faqTitle}
                    onChange={(e) => setFaqTitle(e.target.value)}
                    placeholder="Enter Title"
                    className="flex-1 w-full bg-[#F1F1F1] rounded-lg px-3 py-2 focus:outline-none"
                  />
                </div>

                {/* Description */}
                <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
                  <label className="font-semibold text-[16px] text-grey w-full sm:w-[150px] pt-0 sm:pt-2">
                    Description
                  </label>
                  <textarea
                    value={faqDescription}
                    onChange={(e) => setFaqDescription(e.target.value)}
                    placeholder="Type here..."
                    className="flex-1 w-full bg-[#F1F1F1] rounded-lg px-3 py-2 h-[180px] resize-none focus:outline-none"
                  ></textarea>
                </div>

                {/* Buttons */}
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-4">
                  <button
                    onClick={handleCancel}
                    className="bg-grey text-white font-semibold w-full sm:w-auto px-6 sm:px-[90px] py-2 rounded-3xl"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateFaq}
                    className="bg-primary text-white font-semibold w-full sm:w-auto px-6 sm:px-[70px] py-2 rounded-3xl"
                  >
                    {isEditing ? "Update FAQ" : "Create FAQ"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <Customcard
          heading="Delete FAQ"
          content={
            <div>
              Are you sure you want to delete this FAQ? <br /> This action cannot be undone.
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
          onButton2Click={confirmDelete}
        />
      )}

      {/* Success Modal for Create / Update */}
      {showSuccessModal && (
        <Imagemodal
          heading={
            modalType === "create"
              ? "FAQ's Added"
              : modalType === "delete"
                ? "FAQ Deleted"
                : "FAQ's Updated"
          }
          subheading={
            modalType === "create"
              ? "Your FAQ has been saved."
              : modalType === "delete"
                ? `${deleteTitle || "FAQ"} has been deleted successfully.`
                : "Your FAQ has been saved."
          }
          onClose={() => {
            setShowSuccessModal(false);
            setDeleteTitle(null);
          }}
        />
      )}

      {/* Discard Modal */}
      {showDiscardModal && (
        <Customcard
          heading="Discard FAQ"
          content="Are you sure you want to discard the FAQ? This action cannot be undone."
          button1Text="Cancel"
          button2Text="Discard"
          button1Bg="bg-grey"
          button2Bg="bg-primary"
          onButton1Click={() => setShowDiscardModal(false)}
          onButton2Click={discardFaq}
        />
      )}
    </div>
  );
};
