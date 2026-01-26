import { useEffect, useState } from "react";
import { mediaData } from "../utils/mediaData";
import { Search } from "lucide-react";
import { Customcard } from "../components/Customcard";
import { Imagemodal } from "../components/Imagemodal";
import { useAuth } from "../auth/AuthContext";
import { apiRequest } from "../auth/api";

export const Benefits = () => {
  const auth = useAuth();
  const role = auth.user?.role;
  const canManageBenefits = role === "director" || role === "principal";
  const [showAddBenefits, setShowAddBenefits] = useState(false);
  const [showCustomCard, setShowCustomCard] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [benefitTitle, setBenefitTitle] = useState("");
  const [benefitDescription, setBenefitDescription] = useState("");
  const [benefitsList, setBenefitsList] = useState([]);
  const [activeIndex, setActiveIndex] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedBenefitId, setSelectedBenefitId] = useState(null);
  const [deleteTitle, setDeleteTitle] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const categories = ["Medical", "Lesson", "Tuition"];

  useEffect(() => {
    if (!auth.token) return;
    apiRequest("/content/benefits", { token: auth.token })
      .then((data) => {
        const items = (data.items || []).map((i) => ({
          id: i.id,
          ...(i.data || {}),
        }));
        setBenefitsList(items);
      })
      .catch(() => {});
  }, [auth.token]);

  const handleCancel = () => setShowCustomCard(true);

  const discardBenefit = () => {
    setShowCustomCard(false);
    setShowAddBenefits(false);
    setBenefitTitle("");
    setBenefitDescription("");
    setIsEditing(false);
    setSelectedBenefitId(null);
  };

  // ✅ Add or update grouped benefit by category
  const handleAdd = async () => {
    if (!canManageBenefits) return;
    if (!benefitTitle || !benefitDescription) {
      alert("Please select a category and enter description.");
      return;
    }

    const paragraphs = benefitDescription
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter((p) => p !== "");

    try {
      if (isEditing && selectedBenefitId !== null) {
        const updated = await apiRequest(`/content/benefits/${selectedBenefitId}`, {
          method: "PUT",
          token: auth.token,
          body: { title: benefitTitle, descriptions: paragraphs },
        });
        setBenefitsList((prev) =>
          prev.map((b) =>
            b.id === updated.item.id ? { id: updated.item.id, ...(updated.item.data || {}) } : b
          )
        );
        setShowSuccessModal("updated");
        setIsEditing(false);
        setSelectedBenefitId(null);
      } else {
        const existing = benefitsList.find((b) => b.title === benefitTitle);
        if (existing?.id) {
          const merged = Array.isArray(existing.descriptions)
            ? [...existing.descriptions, ...paragraphs]
            : [...paragraphs];
          const updated = await apiRequest(`/content/benefits/${existing.id}`, {
            method: "PUT",
            token: auth.token,
            body: { title: existing.title, descriptions: merged },
          });
          setBenefitsList((prev) =>
            prev.map((b) =>
              b.id === updated.item.id ? { id: updated.item.id, ...(updated.item.data || {}) } : b
            )
          );
          setShowSuccessModal("added");
        } else {
          const created = await apiRequest("/content/benefits", {
            method: "POST",
            token: auth.token,
            body: { title: benefitTitle, descriptions: paragraphs },
          });
          setBenefitsList((prev) => [{ id: created.item.id, ...(created.item.data || {}) }, ...prev]);
          setShowSuccessModal("added");
        }
      }
    } catch (e) {
      toast.custom((t) => <CustomToast id={t} message={e?.message || "Failed to save benefits"} type="error" />);
      return;
    }

    setShowAddBenefits(false);
    setBenefitTitle("");
    setBenefitDescription("");
  };

  // ✅ Edit entire category block
  const handleEdit = (benefit) => {
    if (!canManageBenefits) return;
    if (!benefit?.id) return;
    setBenefitTitle(benefit.title || "");
    setBenefitDescription(Array.isArray(benefit.descriptions) ? benefit.descriptions.join("\n\n") : "");
    setIsEditing(true);
    setSelectedBenefitId(benefit.id);
    setShowAddBenefits(true);
  };


  // ✅ Delete entire category
  const handleDelete = (benefit) => {
    if (!canManageBenefits) return;
    setSelectedBenefitId(benefit?.id ?? null);
    setDeleteTitle(benefit?.title ?? null);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!canManageBenefits) return;
    if (selectedBenefitId === null) {
      setShowDeleteModal(false);
      return;
    }
    try {
      await apiRequest(`/content/benefits/${selectedBenefitId}`, {
        method: "DELETE",
        token: auth.token,
      });
      setBenefitsList((prev) => prev.filter((b) => b.id !== selectedBenefitId));
      setShowSuccessModal("deleted");
    } catch (e) {
      toast.custom((t) => <CustomToast id={t} message={e?.message || "Failed to delete benefit"} type="error" />);
    } finally {
      setShowDeleteModal(false);
      setSelectedBenefitId(null);
      setDeleteTitle(null);
      setActiveIndex(null);
    }
  };

  // ✅ Search filtering
  const filteredBenefits = benefitsList.filter(
    (benefit) =>
      (benefit.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (Array.isArray(benefit.descriptions) ? benefit.descriptions : []).some((desc) =>
        String(desc || "").toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  // ✅ Group by category
  const benefitsByCategory = categories.map((cat) => ({
    category: cat,
    benefits: filteredBenefits.filter((b) => b.title === cat),
  }));

  return (
    <div className="flex flex-col gap-6 rounded-3xl h-full font-montserrat">
      {!showAddBenefits ? (
        <div className="flex flex-col md:flex-row gap-6 flex-wrap">
          <div className="bg-white rounded-[16px] p-2 sm:p-4 flex-1 flex flex-col gap-6 border min-w-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center h-auto sm:h-[60px] border-b pb-2 sm:pb-0 gap-4 sm:gap-0">
              <h2 className="text-black font-semibold text-[20px] mb-2 sm:mb-0">Employee Benefits</h2>
              {canManageBenefits ? (
                <button
                  className="flex items-center justify-center gap-2 bg-pink text-white rounded-[22px] px-6 py-[10px] shadow-md w-full sm:w-auto"
                  style={{ boxShadow: "0px 4px 6px rgba(0,0,0,0.25)" }}
                  onClick={() => setShowAddBenefits(true)}
                >
                  <span className="text-[24px] leading-none">+</span>
                  <span className="font-semibold text-[16px]">Add Benefits</span>
                </button>
              ) : null}
            </div>

            {/* Search Bar */}
            <div className="w-full mb-4">
              <div className="relative w-full">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-grey">
                  <Search className="w-5 h-5 text-grey" />
                </span>
                <input
                  type="text"
                  placeholder="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg bg-gray-200 placeholder-grey px-10 py-2 text-black font-nunito focus:outline-none"
                />
              </div>
            </div>

            {/* No data */}
            {benefitsList.length === 0 ? (
              <div className="flex justify-center">
                <div className="bg-white rounded-[10px] w-full h-[271px] flex items-center justify-center">
                  <div className="flex flex-col items-center justify-center gap-[16px]">
                    <img
                      src={mediaData.Nomeeting}
                      alt="no data"
                      className="w-[140px] h-[140px] object-cover rounded"
                    />
                    <h3 className="font-semibold text-[18px] text-black">No Data Available Yet...</h3>
                    <p className="font-normal text-grey text-[14px]">
                      Try a different keyword or add a new benefit.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Category Tabs */}
                <div className="flex gap-3 flex-wrap">
                  {categories.map((cat, idx) => (
                    <button
                      key={cat}
                      onClick={() => setActiveIndex(idx)}
                      className={`px-4 py-2 rounded-full font-semibold border transition ${
                        activeIndex === idx
                          ? "bg-primary text-white border-primary"
                          : "bg-white text-primary border-primary"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Active Benefit Section */}
                {activeIndex !== null && benefitsByCategory[activeIndex].benefits.length > 0 ? (
                  benefitsByCategory[activeIndex].benefits.map((benefit, i) => (
                    <div key={i} className="p-1 bg-white flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col gap-2 flex-1 mr-3">
                          {(Array.isArray(benefit.descriptions) ? benefit.descriptions : []).map((desc, idx) => (
                            <p key={idx} className="text-grey text-[14px]">
                              {desc}
                            </p>
                          ))}
                        </div>
                        {canManageBenefits ? (
                          <div className="flex gap-2 items-start">
                            <img
                              src={mediaData.Edit}
                              alt="Edit"
                              className="w-5 h-5 cursor-pointer hover:opacity-70"
                              onClick={() => handleEdit(benefit)}
                            />
                            <img
                              src={mediaData.Recycle}
                              alt="Delete"
                              className="w-5 h-5 cursor-pointer hover:opacity-70"
                              onClick={() => handleDelete(benefit)}
                            />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-grey mt-6 italic">
                    Select a category to view its details.
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        // FULL SCREEN FORM
        <div className="w-full min-h-screen flex flex-col justify-start items-center">
          <div className="bg-white w-full rounded-2xl p-4 sm:p-6 shadow-md">
            <h2 className="text-black font-semibold text-[20px] border-b pb-2 mb-4">
              {isEditing ? "Update Benefit" : "Add Benefits"}
            </h2>

            {/* Select Category */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full mb-4">
              <label className="font-semibold text-grey w-full sm:w-[150px]">Select Category</label>
              <div className="flex flex-wrap gap-3">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setBenefitTitle(cat)}
                    className={`px-5 py-2 rounded-full border transition-all ${
                      benefitTitle === cat
                        ? "bg-primary text-white border-primary"
                        : "bg-white text-primary border-primary hover:bg-primary/10"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Title Input */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full mb-4">
              <label className="font-semibold text-grey w-full sm:w-[150px]">Title</label>
              <input
                type="text"
                placeholder="Enter Category"
                value={benefitTitle}
                onChange={(e) => setBenefitTitle(e.target.value)}
                className="w-full sm:flex-1 px-3 py-2 bg-[#F1F1F1] text-black rounded-lg focus:outline-none"
              />
            </div>

            {/* Description */}
            <div className="flex flex-col sm:flex-row items-start gap-2 sm:gap-4 w-full mb-4">
              <label className="font-semibold text-grey w-full sm:w-[150px] mt-0 sm:mt-2">Description</label>
              <textarea
                placeholder="Type here..."
                rows="7"
                value={benefitDescription}
                onChange={(e) => setBenefitDescription(e.target.value)}
                className="w-full sm:flex-1 px-3 py-2 bg-[#F1F1F1] text-black rounded-lg focus:outline-none resize-none"
              />
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 w-full">
              <button
                type="button"
                className="w-full sm:w-auto px-0 sm:px-[75px] py-2 bg-grey text-white rounded-3xl font-semibold"
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button
                type="button"
                className="w-full sm:w-auto px-0 sm:px-[60px] py-2 bg-primary text-white rounded-3xl font-semibold"
                onClick={handleAdd}
              >
                {isEditing ? "Update Benefit" : "Add Benefits"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discard Modal */}
      {showCustomCard && (
        <Customcard
          heading="Discard Benefit"
          content="Are you sure you want to discard this benefit? This action cannot be undone."
          button1Text="Cancel"
          button2Text="Discard"
          button1Bg="bg-grey"
          button2Bg="bg-primary"
          onButton1Click={() => setShowCustomCard(false)}
          onButton2Click={discardBenefit}
        />
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <Customcard
          heading="Delete Benefit"
          content={
            <div>
              Are you sure you want to delete this benefit? <br />
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
          onButton2Click={confirmDelete}
        />
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <Imagemodal
          heading={
            showSuccessModal === "added"
              ? "Benefits Added"
              : showSuccessModal === "deleted"
                ? "Benefit Deleted"
                : "Benefit Updated"
          }
          subheading={
            showSuccessModal === "added"
              ? "Benefits have been added successfully."
              : showSuccessModal === "deleted"
                ? `${deleteTitle || "Benefit"} has been deleted successfully.`
              : "Benefit has been updated successfully."
          }
          onClose={() => setShowSuccessModal(false)}
          image={mediaData.Success}
        />
      )}
    </div>
  );
};
