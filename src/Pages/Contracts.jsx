import { useEffect, useState } from "react";
import { mediaData } from "../utils/mediaData";
import { Table } from "../components/Table";
import { Imagemodal } from "../components/Imagemodal";
import { Customcard } from "../components/Customcard";
import { useAuth } from "../auth/AuthContext";
import { apiRequest } from "../auth/api";

export const Contracts = () => {
  const auth = useAuth();
  const role = auth.user?.role;
  const canManageContracts = role === "director";
  const [showUploadContract, setShowUploadContract] = useState(false);
  const [contractName, setContractName] = useState("");
  const [fileDataUrl, setFileDataUrl] = useState(null);
  const [fileName, setFileName] = useState("");
  const [uploadedContracts, setUploadedContracts] = useState([]);
  const [showCustomCard, setShowCustomCard] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // NEW STATES
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [contractToDelete, setContractToDelete] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState(null);
  const [modalType, setModalType] = useState("uploaded");

  useEffect(() => {
    if (!auth.token) return;
    apiRequest("/content/contracts", { token: auth.token })
      .then((data) => {
        const items = (data.items || []).map((i) => ({
          id: i.id,
          created_at: i.created_at,
          updated_at: i.updated_at,
          ...(i.data || {}),
        }));
        setUploadedContracts(items);
      })
      .catch(() => {});
  }, [auth.token]);

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    if (selectedFile.type !== "application/pdf") {
      alert("Please upload a PDF file.");
      return;
    }

    const maxBytes = 600 * 1024;
    if (selectedFile.size > maxBytes) {
      alert("PDF is too large. Please upload a smaller file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setFileDataUrl(event.target.result);
      setFileName(selectedFile.name);
    };
    reader.readAsDataURL(selectedFile);
  };

  // Cancel upload form
  const handleCancel = () => setShowCustomCard(true);

  const discardContract = () => {
    setShowUploadContract(false);
    setContractName("");
    setFileDataUrl(null);
    setFileName("");
    setShowCustomCard(false);
    setIsEditing(false);
    setSelectedContractId(null);
  };

  // Upload or update contract
  const handleUpload = async () => {
    if (!canManageContracts) return;
    if (!contractName || !fileDataUrl) {
      toast.custom((t) => <CustomToast id={t} message="Please fill all fields" type="error" />);
      return;
    }

    try {
      if (isEditing && selectedContractId !== null) {
        const updated = await apiRequest(`/content/contracts/${selectedContractId}`, {
          method: "PUT",
          token: auth.token,
          body: { name: contractName, fileDataUrl, fileName },
        });
        setUploadedContracts((prev) =>
          prev.map((c) =>
            c.id === updated.item.id
              ? {
                  id: updated.item.id,
                  created_at: updated.item.created_at,
                  updated_at: updated.item.updated_at,
                  ...(updated.item.data || {}),
                }
              : c
          )
        );
        setModalType("updated");
      } else {
        const created = await apiRequest("/content/contracts", {
          method: "POST",
          token: auth.token,
          body: { name: contractName, fileDataUrl, fileName },
        });
        setUploadedContracts((prev) => [
          {
            id: created.item.id,
            created_at: created.item.created_at,
            updated_at: created.item.updated_at,
            ...(created.item.data || {}),
          },
          ...prev,
        ]);
        setModalType("uploaded");
      }

      setShowSuccessModal(true);
      setShowUploadContract(false);
      setContractName("");
      setFileDataUrl(null);
      setFileName("");
      setIsEditing(false);
      setSelectedContractId(null);
    } catch (e) {
      toast.custom((t) => <CustomToast id={t} message={e?.message || "Failed to save contract"} type="error" />);
    }
  };


  // Confirm delete
  const confirmDeleteContract = (contract) => {
    if (!canManageContracts) return;
    setContractToDelete(contract);
    setShowDeleteModal(true);
  };

  // Delete contract
  const handleDeleteContract = async () => {
    if (!canManageContracts) return;
    if (!contractToDelete?.id) {
      setShowDeleteModal(false);
      return;
    }
    try {
      await apiRequest(`/content/contracts/${contractToDelete.id}`, {
        method: "DELETE",
        token: auth.token,
      });
      setUploadedContracts((prev) => prev.filter((c) => c.id !== contractToDelete.id));
      setModalType("deleted");
      setShowSuccessModal(true);
    } catch (e) {
      toast.custom((t) => <CustomToast id={t} message={e?.message || "Failed to delete contract"} type="error" />);
    } finally {
      setShowDeleteModal(false);
      setContractToDelete(null);
    }
  };

  // Edit contract
  const handleEditContract = (contract) => {
    if (!canManageContracts) return;
    setContractName(contract.name || "");
    setFileDataUrl(contract.fileDataUrl || null);
    setFileName(contract.fileName || "");
    setShowUploadContract(true);
    setIsEditing(true);
    setSelectedContractId(contract.id ?? null);
  };

  // Table Configuration
  const columns = [
    { header: "Contract Name", key: "Name" },
    { header: "Document", key: "Document" },
    ...(canManageContracts ? [{ header: "Action", key: "Action" }] : []),
  ];

  const tableData = uploadedContracts.map((contract) => ({
    __id: contract.id,
    Name: {
      type: "text",
      value: contract.name
        ? contract.name
            .toLowerCase()
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")
        : "",
    },
    Document: {
      type: "image", 
      value: mediaData.Pdf1, 
      onClick: () => {
          if (!contract.fileDataUrl) return;
          window.open(contract.fileDataUrl);
      }
    },
    Action: canManageContracts
      ? { type: "image", value: [mediaData.Recycle, mediaData.Edit] }
      : { type: "text", value: "" },
  }));

  const emptyState = (
    <div className="flex justify-center">
      <div className="bg-white rounded-[10px] w-full max-w-full h-[271px] flex items-center justify-center">
        <div className="flex flex-col items-center justify-center gap-[16px]">
          <img
            src={mediaData.Nomeeting}
            alt="content"
            className="w-[140px] h-[140px] object-cover rounded"
          />
          <h3 className="font-montserrat font-semibold text-[18px] text-black text-center">
            No Contracts Available Yet...
          </h3>
          <p className="font-montserrat font-normal text-[14px] text-center text-grey">
            Upload a contract PDF to make it available here.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full">
      {!showUploadContract ? (
        <Table
          title="Union Contracts List"
          buttonText="Upload Contracts"
          onButtonClick={
            canManageContracts
              ? () => {
                  setShowUploadContract(true);
                  setIsEditing(false);
                  setSelectedContractId(null);
                  setContractName("");
                  setFileDataUrl(null);
                  setFileName("");
                }
              : undefined
          }
          columns={columns}
          data={tableData}
          onCircleClick={(row) => {
             const contract = uploadedContracts.find(c => c.id === row.__id);
             confirmDeleteContract(contract);
          }}
          onEditClick={(row) => {
             const contract = uploadedContracts.find(c => c.id === row.__id);
             handleEditContract(contract);
          }}
          emptyState={emptyState}
        />
      ) : (
        // Upload/Edit Form
        <div className="flex flex-col w-full gap-6 bg-white font-montserrat rounded-3xl h-full p-4 sm:p-6 items-start font-montserrat">
          <h2 className="w-full text-black font-semibold text-[20px] border-b pb-2">
            {isEditing ? "Edit Contract" : "Create Contract"}
          </h2>

          <div
            className="flex flex-col w-full gap-6 shadow-md"
            style={{
              boxShadow: "0px 0px 4px 0px rgba(0,0,0,0.25)",
              borderRadius: "0.375rem",
              padding: "1rem",
            }}
          >
            <div className="flex justify-center items-center w-full h-full">
              <div
                className="flex flex-col items-center justify-center w-full max-w-sm h-60 gap-6 border-2 border-dashed border-gray-300 rounded-md cursor-pointer"
                onClick={() => document.getElementById("fileInput").click()}
              >
                {fileDataUrl ? (
                  <img
                    src={mediaData.Pdf1}
                    alt="PDF Uploaded"
                    className="w-[460px] h-[460px] object-contain"
                  />
                ) : (
                  <img
                    src={mediaData.Contract}
                    alt="Upload"
                    className="w-70 h-70 object-contain"
                  />
                )}

                <p className="text-grey font-montserrat text-base text-center mb-5">
                  Drag and drop PDF or{" "}
                  <span className="text-primary">Browse Files</span>
                </p>

                <input
                  id="fileInput"
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full sm:items-center">
              <label className="font-semibold text-grey w-full sm:w-[200px] flex items-center">
                Contract Name
              </label>
              <input
                type="text"
                placeholder="Enter Name"
                value={contractName}
                onChange={(e) => setContractName(e.target.value)}
                className="w-full px-3 py-3 bg-[#F1F1F1] text-black rounded-lg focus:outline-none"
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 w-full">
              <button
                type="button"
                className="w-full sm:w-auto px-6 sm:px-[75px] py-2 bg-grey text-white rounded-3xl font-semibold"
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button
                type="button"
                className="w-full sm:w-auto px-6 sm:px-[50px] py-2 bg-primary text-white rounded-3xl font-semibold"
                onClick={handleUpload}
              >
                {isEditing ? "Update Contract" : "Upload Contract"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discard Modal */}
      {showCustomCard && (
        <Customcard
          heading="Discard Contract"
          content="Are you sure you want to discard this contract? This action cannot be undone."
          button1Text="Cancel"
          button2Text="Discard"
          button1Bg="bg-grey"
          button2Bg="bg-primary"
          onButton1Click={() => setShowCustomCard(false)}
          onButton2Click={discardContract}
        />
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <Customcard
          heading="Delete Contract"
          content={
            <div>
              Are you sure you want to delete the contract? <br />
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
          onButton2Click={handleDeleteContract}
        />
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <Imagemodal
          heading={
            modalType === "deleted"
              ? "Contract Deleted"
              : modalType === "updated"
                ? "Contract Updated"
                : "Contract Uploaded"
          }
          subheading={
            modalType === "deleted"
              ? "The contract has been successfully deleted."
              : modalType === "updated"
                ? "The contract has been successfully updated."
                : "The contract has been successfully uploaded."
          }
          onClose={() => {
            setShowSuccessModal(false);
            setModalType("uploaded");
          }}
        />
      )}
    </div>
  );
};
