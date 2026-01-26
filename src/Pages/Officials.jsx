import { useEffect, useState } from "react";
import { mediaData } from "../utils/mediaData";
import { Table } from "../components/Table";
import { Imagemodal } from "../components/Imagemodal";
import { Customcard } from "../components/Customcard";
import { useAuth } from "../auth/AuthContext";
import { apiRequest } from "../auth/api";
import { toast } from "sonner";
import { CustomToast } from "../components/CustomToast";
import { ChevronDown } from "lucide-react";

export const Officials = () => {
  const auth = useAuth();
  const role = auth.user?.role;
  const canManageOfficials = role === "director";
  const [showAddOfficial, setShowAddOfficial] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedOfficialId, setSelectedOfficialId] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [modalHeading, setModalHeading] = useState("Official Added");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTitle, setDeleteTitle] = useState(null);

  const [showCustomCard, setShowCustomCard] = useState(false);

  const [officialData, setOfficialData] = useState({
    name: "",
    email: "",
    role: "",
    phone: "",
    contact: "",
    image: null,
  });
  const [officialsList, setOfficialsList] = useState([]);

  useEffect(() => {
    if (!auth.token) return;
    apiRequest("/content/officials", { token: auth.token })
      .then((data) => {
        const items = (data.items || []).map((i) => ({
          id: i.id,
          created_at: i.created_at,
          updated_at: i.updated_at,
          ...(i.data || {}),
        }));
        setOfficialsList(items);
      })
      .catch(() => {});
  }, [auth.token]);

  // Input change handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setOfficialData((prev) => ({ ...prev, [name]: value }));
  };

  // Image upload handler
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setOfficialData((prev) => ({ ...prev, image: event.target.result }));
    };
    reader.readAsDataURL(file);
  };

  // Cancel button inside form → show discard confirmation
  const handleCancel = () => setShowCustomCard(true);

  const discardOfficial = () => {
    setShowAddOfficial(false);
    setOfficialData({ name: "", email: "", role: "", phone: "", contact: "", image: null });
    setIsEditMode(false);
    setSelectedOfficialId(null);
    setShowCustomCard(false);
  };

  // Add or Update official
  const handleAddOrUpdateOfficial = async () => {
    if (!canManageOfficials) return;
    if (!officialData.name || !officialData.email || !officialData.role || !officialData.phone || !officialData.contact) {
      toast.custom((t) => <CustomToast id={t} message="Please fill all fields" type="error" />);
      return;
    }

    try {
      if (isEditMode && selectedOfficialId !== null) {
        const updated = await apiRequest(`/content/officials/${selectedOfficialId}`, {
          method: "PUT",
          token: auth.token,
          body: { ...officialData },
        });
        setOfficialsList((prev) =>
          prev.map((o) =>
            o.id === updated.item.id
              ? {
                  id: updated.item.id,
                  created_at: updated.item.created_at,
                  updated_at: updated.item.updated_at,
                  ...(updated.item.data || {}),
                }
              : o
          )
        );
        setModalHeading("Official Updated");
      } else {
        const created = await apiRequest("/content/officials", {
          method: "POST",
          token: auth.token,
          body: { ...officialData },
        });
        setOfficialsList((prev) => [
          {
            id: created.item.id,
            created_at: created.item.created_at,
            updated_at: created.item.updated_at,
            ...(created.item.data || {}),
          },
          ...prev,
        ]);
        setModalHeading("Official Added");
      }

      setShowModal(true);
      setOfficialData({ name: "", email: "", role: "", phone: "", contact: "", image: null });
      setShowAddOfficial(false);
      setIsEditMode(false);
      setSelectedOfficialId(null);
    } catch (e) {
      toast.custom((t) => <CustomToast id={t} message={e?.message || "Failed to save official"} type="error" />);
    }
  };

  // Delete official
  const handleDeleteOfficial = (official) => {
    if (!canManageOfficials) return;
    setSelectedOfficialId(official?.id ?? null);
    setDeleteTitle(official?.name ?? null);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!canManageOfficials) return;
    if (selectedOfficialId === null) {
      setShowDeleteModal(false);
      return;
    }
    try {
      await apiRequest(`/content/officials/${selectedOfficialId}`, {
        method: "DELETE",
        token: auth.token,
      });
      setOfficialsList((prev) => prev.filter((o) => o.id !== selectedOfficialId));
      setModalHeading("Official Deleted");
      setShowModal(true);
    } catch (e) {
      toast.custom((t) => <CustomToast id={t} message={e?.message || "Failed to delete official"} type="error" />);
    } finally {
      setShowDeleteModal(false);
      setSelectedOfficialId(null);
    }
  };

  // Edit official
  const handleEditOfficial = (official) => {
    if (!canManageOfficials) return;
    if (!official?.id) return;
    setOfficialData({
      name: official.name || "",
      email: official.email || "",
      role: official.role || "",
      phone: official.phone || "",
      contact: official.contact || "",
      image: official.image || null,
    });
    setShowAddOfficial(true);
    setIsEditMode(true);
    setSelectedOfficialId(official.id);
  };

  const columns = [
    { header: "Name", key: "Name" },
    { header: "Email", key: "Email" },
    { header: "Role", key: "Role" },
    { header: "Phone Number", key: "Phone" },
    ...(canManageOfficials ? [{ header: "Action", key: "Action" }] : []),
  ];

  const tableData = officialsList.map((official) => ({
    __id: official.id,
    Name: {
      type: "user",
      value: official.name
        ? official.name
            .toLowerCase()
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")
        : "",
      image: official.image || mediaData.User,
    },
    Email: { type: "text", value: official.email },
    Role: {
      type: "text",
      value: official.role
        ? official.role
            .replace(/_/g, " ")
            .toLowerCase()
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")
        : "",
    },
    Phone: { type: "text", value: official.phone },
    Action: canManageOfficials
      ? { type: "image", value: [mediaData.Edit, mediaData.Recycle] }
      : { type: "text", value: "" },
  }));

  return (
    <>
      {!showAddOfficial ? (
        <Table
          title="Union Officials List"
          buttonText="Add Official"
          onButtonClick={
            canManageOfficials
              ? () => {
                  setOfficialData({ name: "", email: "", role: "", phone: "", contact: "", image: null });
                  setIsEditMode(false);
                  setSelectedOfficialId(null);
                  setShowAddOfficial(true);
                }
              : undefined
          }
          columns={columns}
          data={tableData}
          onActionClick={(row, actionIndex) => {
            const official = officialsList.find((o) => o.id === row.__id);
            if (actionIndex === 0) handleEditOfficial(official);
            if (actionIndex === 1) handleDeleteOfficial(official);
          }}
        />
      ) : (
        <div className="bg-white rounded-[16px] p-4 flex flex-col gap-6 min-w-0 shadow">
          <div className="flex flex-col gap-4 rounded-lg p-2 w-full">
            <h2 className="text-black font-montserrat font-semibold text-[20px] border-b pb-2">
              {isEditMode ? "Edit Official" : "Add Official"}
            </h2>
            <div
              className="shadow-md p-2 rounded-2xl"
              style={{
                boxShadow: "0px 0px 4px 0px rgba(0,0,0,0.25)",
              }}
            >
              {/* Image Picker */}
              <div className="flex justify-center mb-4">
                <label className="cursor-pointer">
                  <div className="relative w-[140px] h-[140px] mx-auto">
                    <img
                      src={officialData.image || mediaData.Camera}
                      alt="Pick media"
                      className={`w-full h-full object-cover ${
                        officialData.image ? "rounded-full" : "rounded-lg"
                      }`}
                    />
                    {officialData.image && (
                      <img
                        src={mediaData.Camera2}
                        alt="Camera"
                        className="absolute w-9 h-9 bottom-2 right-2 rounded-full border border-white cursor-pointer"
                      />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </div>
                </label>
              </div>

              {/* Input Fields */}
              <div className="flex flex-col gap-3 p-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <label className="w-full sm:w-[170px] font-semibold font-montserrat text-grey">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter Name"
                    value={officialData.name}
                    onChange={handleInputChange}
                    className="flex-1 w-full px-3 py-3 focus:outline-none text-black rounded-xl bg-[#F1F1F1] font-montserrat"
                  />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <label className="w-full sm:w-[170px] font-semibold font-montserrat text-grey">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter Email"
                    value={officialData.email}
                    onChange={handleInputChange}
                    className="flex-1 w-full px-3 py-3 focus:outline-none text-black rounded-xl bg-[#F1F1F1] font-montserrat"
                  />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <label className="w-full sm:w-[170px] font-semibold font-montserrat text-grey">
                    Role
                  </label>
                  <div className="relative flex-1 w-full">
                    <select
                      name="role"
                      value={officialData.role}
                      onChange={handleInputChange}
                      className="w-full px-3 py-3 focus:outline-none text-black rounded-xl bg-[#F1F1F1] font-montserrat appearance-none pr-10"
                    >
                      <option value="" disabled>
                        Select Role
                      </option>
                      <option value="principal">Principal</option>
                      <option value="vice_principal">Vice Principal</option>
                      <option value="teacher">Teacher</option>
                      <option value="tech_staff">Tech Staff</option>
                    </select>
                    <ChevronDown
                      className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                      size={20}
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <label className="w-full sm:w-[170px] font-semibold font-montserrat text-grey">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    name="phone"
                    placeholder="Enter Phone Number"
                    value={officialData.phone}
                    onChange={handleInputChange}
                    className="flex-1 w-full px-3 py-3 focus:outline-none text-black rounded-xl bg-[#F1F1F1] font-montserrat"
                  />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <label className="w-full sm:w-[170px] font-semibold font-montserrat text-grey">
                    Contact Link
                  </label>
                  <input
                    type="text"
                    name="contact"
                    placeholder="Enter URL"
                    value={officialData.contact}
                    onChange={handleInputChange}
                    className="flex-1 w-full px-3 py-3 focus:outline-none text-black rounded-xl bg-[#F1F1F1] font-montserrat"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 mt-2 font-montserrat mx-3 mb-3">
                <button
                  className="w-full sm:w-auto px-6 sm:px-[70px] py-2 bg-grey text-white rounded-3xl font-semibold"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button
                  className="w-full sm:w-auto px-6 sm:px-[70px] py-2 bg-primary text-white rounded-3xl font-semibold"
                  onClick={handleAddOrUpdateOfficial}
                >
                  {isEditMode ? "Update" : "Add Official"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Added/Updated Modal */}
      {showModal && (
        <Imagemodal
          heading={modalHeading}
          subheading={
            modalHeading === "Official Deleted"
              ? "The official has been successfully deleted."
              : modalHeading === "Official Updated"
              ? "The official has been successfully updated."
              : "The official has been successfully added."
          }
          onClose={() => {
            setShowModal(false);
            setDeleteTitle(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <Customcard
          heading="Delete Official"
          content={
            <div>
              Are you sure you want to delete {deleteTitle ? `"${deleteTitle}"` : "this official"}? <br />
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
          onClose={() => setShowDeleteModal(false)}
        />
      )}

      {/* Discard Confirmation Modal */}
      {showCustomCard && (
        <Customcard
          heading="Discard Changes?"
          content="Are you sure you want to discard your changes? This action cannot be undone."
          button1Text="No, Keep Editing"
          button2Text="Yes, Discard"
          button1Bg="bg-gray-400"
          button2Bg="bg-[#E30000]"
          onButton1Click={() => setShowCustomCard(false)}
          onButton2Click={discardOfficial}
        />
      )}
    </>
  );
};
