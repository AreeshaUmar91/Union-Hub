import { useEffect, useState } from "react";
import { mediaData } from "../utils/mediaData";
import { Customcard } from "../components/Customcard";
import { Imagemodal } from "../components/Imagemodal";
import { Search } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { apiRequest } from "../auth/api";
import { toast } from "sonner";
import { CustomToast } from "../components/CustomToast";

export const Vote = () => {
  const auth = useAuth();
  const isDirector = ["director", "principal", "vice_principal"].includes(auth.user?.role);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [isCancelDiscard, setIsCancelDiscard] = useState(true);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [pendingVote, setPendingVote] = useState(null);

  const [pollName, setPollName] = useState("");
  const [pollDesc, setPollDesc] = useState("");
  const [targetRole, setTargetRole] = useState("other");
  const [endDate, setEndDate] = useState("");
  const [candidates, setCandidates] = useState([
    { name: "", email: "", image: mediaData.Camera, votes: 0 },
    { name: "", email: "", image: mediaData.Camera, votes: 0 },
    { name: "", email: "", image: mediaData.Camera, votes: 0 },
  ]);
  const [polls, setPolls] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [modalType, setModalType] = useState(""); // "created" or "updated"
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("pending");

  useEffect(() => {
    if (!auth.token) return;
    apiRequest("/content/votes", { token: auth.token })
      .then((data) => {
        const items = (data.items || []).map((i) => ({ id: i.id, ...(i.data || {}) }));
        setPolls(items);
      })
      .catch(() => {});
  }, [auth.token]);

  useEffect(() => {
    if (isDirector && auth.token) {
      apiRequest("/director/users", { token: auth.token })
        .then((data) => setUsers(data.users || []))
        .catch(() => {});
    }
  }, [isDirector, auth.token]);

  const getPollStatus = (poll) => {
    if (!poll.endDate) return "pending";
    const end = new Date(poll.endDate);
    const now = new Date();
    return end < now ? "completed" : "pending";
  };

  const filteredPolls = polls.filter(
    (poll) =>
      getPollStatus(poll) === activeTab &&
      (poll.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      poll.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleImageUpload = (e, idx) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newCands = [...candidates];
        newCands[idx].image = event.target.result;
        setCandidates(newCands);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRecycle = (idx) => {
    setCandidates(candidates.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!isDirector) return;

    if (!pollName || !pollDesc || !endDate) {
      toast.custom((t) => <CustomToast id={t} message="Please fill all fields" type="error" />);
      return;
    }

    try {
      if (editIndex !== null) {
        const current = polls[editIndex];
        if (current?.id) {
          const updated = await apiRequest(`/content/votes/${current.id}`, {
            method: "PUT",
            token: auth.token,
            body: { name: pollName, description: pollDesc, candidates, endDate },
          });
          const next = [...polls];
          next[editIndex] = { id: updated.item.id, ...(updated.item.data || {}) };
          setPolls(next);
          setModalType("updated");
        }
      } else {
        const created = await apiRequest("/content/votes", {
          method: "POST",
          token: auth.token,
          body: { name: pollName, description: pollDesc, candidates, endDate },
        });
        setPolls([...polls, { id: created.item.id, ...(created.item.data || {}) }]);
        setModalType("created");
      }

      setShowForm(false);
      setShowImageModal(true);

      setPollName("");
      setPollDesc("");
      setTargetRole("other");
      setEndDate("");
      setCandidates([
        { name: "", email: "", image: mediaData.Camera, votes: 0 },
        { name: "", email: "", image: mediaData.Camera, votes: 0 },
        { name: "", email: "", image: mediaData.Camera, votes: 0 },
      ]);
      setEditIndex(null);
    } catch (e) {
      toast.custom((t) => <CustomToast id={t} message={e?.message || "Failed to save poll"} type="error" />);
    }
  };

  const handleEdit = (poll, idx) => {
    if (!isDirector) return;
    setPollName(poll.name);
    setPollDesc(poll.description);
    setTargetRole(poll.targetRole || "other");
    setEndDate(poll.endDate || "");
    setCandidates(poll.candidates);
    setShowForm(true);
    setEditIndex(idx);
  };

  const handleVoteClick = (pollIndex, candidateIndex) => {
    setPendingVote({ pollIndex, candidateIndex });
    setShowVoteModal(true);
  };

  const confirmVote = async () => {
    if (!pendingVote) return;
    const { pollIndex, candidateIndex } = pendingVote;
    await handleVote(pollIndex, candidateIndex);
    setShowVoteModal(false);
    setPendingVote(null);
  };

  const handleVote = async (pollIndex, candidateIndex) => {
    const poll = polls[pollIndex];
    if (!auth.token || !poll.id) return;
    
    try {
      const response = await apiRequest(`/content/votes/${poll.id}/vote`, {
        method: "POST",
        token: auth.token,
        body: { candidateIndex },
      });
      
      const updatedPolls = [...polls];
      updatedPolls[pollIndex].candidates = response.candidates;
      updatedPolls[pollIndex].votedUsers = response.votedUsers;
      setPolls(updatedPolls);
      
      toast.custom((t) => <CustomToast id={t} message="Vote submitted successfully!" type="success" />);
    } catch (e) {
      toast.custom((t) => <CustomToast id={t} message={e?.message || "Failed to vote"} type="error" />);
    }
  };

  return (
    <div className="flex flex-col gap-6 bg-[#FAFAFA] rounded-3xl h-full font-montserrat ">
      <div className="bg-white rounded-[16px] p-2 sm:p-4 flex flex-col gap-6 border min-w-0">
        {/* Heading + New Vote Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center h-auto sm:h-[60px] border-b pb-2 gap-4 sm:gap-0">
          <h2 className="text-black font-montserrat font-semibold text-[20px] mb-2 sm:mb-0">
            {showForm ? (editIndex !== null ? "Update Voting Poll" : "Create Voting Poll") : "Voting List"}
          </h2>
          {!showForm && isDirector ? (
            <button
              className="flex items-center justify-center gap-2 bg-pink text-white rounded-[25px] px-6 py-3 shadow-md w-full sm:w-auto"
              style={{ boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.25)" }}
              onClick={() => {
                setShowForm(true);
                setEditIndex(null);
                setPollName("");
                setPollDesc("");
                setTargetRole("other");
                setEndDate("");
                setCandidates([
                  { name: "", email: "", image: mediaData.Camera, votes: 0 },
                  { name: "", email: "", image: mediaData.Camera, votes: 0 },
                  { name: "", email: "", image: mediaData.Camera, votes: 0 },
                ]);
              }}
            >
              <span className="text-[22px] font-bold leading-none mt-[-px]">+</span>
              <span className="font-montserrat font-semibold text-[16px] leading-none">New Vote</span>
            </button>
          ) : null}
        </div>

        {/* Tabs */}
        {!showForm && (
          <div className="flex gap-4 border-b px-2 sm:px-0 mb-4">
            <button
              className={`pb-2 px-4 font-montserrat font-semibold ${
                activeTab === "pending" ? "text-primary border-b-2 border-primary" : "text-grey"
              }`}
              onClick={() => setActiveTab("pending")}
            >
              Upcoming
            </button>
            <button
              className={`pb-2 px-4 font-montserrat font-semibold ${
                activeTab === "completed" ? "text-primary border-b-2 border-primary" : "text-grey"
              }`}
              onClick={() => setActiveTab("completed")}
            >
              Completed
            </button>
          </div>
        )}

        {/* Search Bar */}
        {!showForm && (
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
                className="w-full rounded-lg placeholder-grey bg-gray-200 px-10 py-2 text-black font-nunito focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Form */}
        {showForm && isDirector ? (
          <div className="flex flex-col items-start gap-6">
            <div className="w-full rounded-[10px] p-2 sm:p-4 flex flex-col gap-6 shadow-md">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-[80px]">
                <label className="font-montserrat font-semibold text-[16px] text-grey whitespace-nowrap">Poll Type</label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="flex-1 border rounded-xl px-3 py-2 text-black font-montserrat bg-[#F1F1F1]"
                >
                  <option value="other">General / Other</option>
                  <option value="principal">Selecting Principal</option>
                  <option value="vice_principal">Selecting Vice Principal</option>
                  <option value="teacher">Selecting Teacher</option>
                  <option value="tech_staff">Selecting Tech Staff</option>
                </select>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-[80px]">
                <label className="font-montserrat font-semibold text-[16px] text-grey whitespace-nowrap">Poll Name</label>
                <input
                  type="text"
                  placeholder="Enter Title"
                  value={pollName}
                  onChange={(e) => setPollName(e.target.value)}
                  className="flex-1 border rounded-xl px-3 py-2 text-black font-montserrat bg-[#F1F1F1]"
                />
              </div>
              <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-[70px]">
                <label className="font-montserrat font-semibold text-[16px] text-grey">Description</label>
                <textarea
                  placeholder="Type Here..."
                  value={pollDesc}
                  onChange={(e) => setPollDesc(e.target.value)}
                  className="w-full border resize-none rounded-xl font-montserrat px-3 py-2 text-black bg-[#F1F1F1]"
                  rows={5}
                />
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-[80px]">
                <label className="font-montserrat font-semibold text-[16px] text-grey whitespace-nowrap">End Date</label>
                <input
                  type="datetime-local"
                  value={endDate}
                  min={new Date().toISOString().slice(0, 16)}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="flex-1 border rounded-xl px-3 py-2 text-black font-montserrat bg-[#F1F1F1]"
                />
              </div>
            </div>

            {/* Add Candidate Button */}
            <div className="flex justify-end w-full">
              <button
                onClick={() => setCandidates([...candidates, { name: "", email: "", image: mediaData.Camera, votes: 0 }])}
                className="w-full sm:w-[252px] h-[44px] flex items-center justify-center gap-2 bg-pink text-white rounded-[22px] px-4 py-2 font-semibold shadow-md"
              >
                <span className="text-[24px] leading-none">+</span>
                <span className="leading-none">New Candidate</span>
              </button>
            </div>

            {/* Candidates */}
            <div className="flex flex-col gap-4 w-full">
              {candidates.map((c, idx) => (
                <div key={idx} className="rounded-xl p-2 sm:p-4 flex flex-col gap-2 shadow-md">
                  <div className="flex items-center justify-between">
                    <h3 className="font-montserrat font-semibold text-[14px] text-black">Candidate {idx + 1}</h3>
                    <img
                      src={mediaData.Recycle}
                      alt="recycle"
                      className="w-5 h-5 cursor-pointer hover:opacity-70 transition"
                      onClick={() => handleRecycle(idx)}
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="relative w-[60px] h-[60px] rounded-full overflow-hidden p-[6px]">
                      <label htmlFor={`candidate-${idx}-image`} className="cursor-pointer w-full h-full block">
                        <img src={c.image} alt="candidate" className="w-full h-full object-cover" />
                      </label>
                      <input
                        id={`candidate-${idx}-image`}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, idx)}
                      />
                    </div>
                    <div className="flex flex-col gap-2 w-full sm:flex-1">
                      <input
                        type="text"
                        list={`users-list-${idx}`}
                        placeholder="Enter Email"
                        value={c.email || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          const found = users.find((u) => u.email === val);
                          
                          if (found && found.role === targetRole) {
                            toast.custom((t) => (
                              <CustomToast 
                                id={t} 
                                message={`Cannot select current ${found.role} for this poll`} 
                                type="error" 
                              />
                            ));
                            return;
                          }

                          const newCands = [...candidates];
                          newCands[idx].email = val;
                          if (found && found.name) {
                            newCands[idx].name = found.name;
                          }
                          setCandidates(newCands);
                        }}
                        className="w-full border text-black rounded-xl px-3 py-2 font-montserrat bg-[#F1F1F1]"
                      />
                      <datalist id={`users-list-${idx}`}>
                        {users
                          .filter((u) => {
                            // Base allowed roles for candidates (expanded to include admins if they are running for something else)
                            const allowedRoles = ["teacher", "tech_staff", "vice_principal", "principal"];
                            if (!allowedRoles.includes(u.role)) return false;
                            // Exclude if user holds the role being voted for
                            if (u.role === targetRole) return false;
                            return true;
                          })
                          .map((u, i) => (
                            <option key={i} value={u.email}>
                              {u.name} ({u.role})
                            </option>
                          ))}
                      </datalist>
                      <input
                        type="text"
                        placeholder="Enter Name"
                        value={c.name}
                        onChange={(e) => {
                          const newCands = [...candidates];
                          newCands[idx].name = e.target.value;
                          setCandidates(newCands);
                        }}
                        className="w-full border text-black rounded-xl px-3 py-2 font-montserrat bg-[#F1F1F1]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Cancel & Submit */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 w-full">
              <button
  onClick={() => {
    setIsCancelDiscard(true);
    setShowDiscardModal(true);
  }}
  className="w-full sm:w-[222px] h-[44px] flex font-semibold items-center justify-center gap-3 bg-grey text-white rounded-[22px] px-4 py-2 shadow-md"
>
  Cancel
</button>

              <button
                onClick={handleSubmit}
                className="w-full sm:w-[222px] h-[44px] flex font-semibold items-center justify-center gap-3 bg-primary text-white rounded-[22px] px-4 py-2 shadow-md"
              >
                {editIndex !== null ? "Update Poll" : "Create Voting Poll"}
              </button>
            </div>
          </div>
        ) : (
    <div className="flex flex-wrap gap-4">
  {filteredPolls.length === 0 ? (
    <div className="bg-white rounded-[10px] w-full h-[271px] flex items-center justify-center">
      <div className="flex flex-col items-center justify-center gap-4">
        <img src={mediaData.Nomeeting} alt="content" className="w-[140px] h-[140px] object-cover rounded" />
        <h3 className="font-montserrat font-semibold text-[18px] text-black text-center">No {activeTab} Polls...</h3>
        <p className="font-montserrat font-normal text-grey text-[14px] text-center">
          {activeTab === "pending" ? "Create a poll to start collecting votes." : "No completed polls found."}
        </p>
      </div>
    </div>
  ) : (
    filteredPolls.map((poll, idx) => {
      const isCandidate = poll.candidates.some(c => c.email && c.email === auth.user?.email);
      return (
      <div key={idx} className="flex-1 w-full sm:min-w-[48%] sm:max-w-[48%]">
        <div className="rounded-[10px] p-2 sm:p-4 shadow-md flex flex-col gap-4">
          {/* Poll Header */}
          <div className="flex justify-between items-start mb-4 flex-col sm:flex-row">
            <div>
              <h3 className="text-lg font-montserrat font-semibold text-primary">{poll.name}</h3>
              <p className="text-sm text-grey font-montserrat">{poll.description}</p>
            </div>
            {isDirector ? (
              <div className="flex gap-2">
                {activeTab !== "completed" && (
                  <img
                    src={mediaData.Edit}
                    alt="update"
                    className="w-5 h-5 cursor-pointer"
                    onClick={() => handleEdit(poll, idx)}
                  />
                )}
                <img
                  src={mediaData.Recycle}
                  alt="delete"
                  className="w-5 h-5 cursor-pointer"
                  onClick={() => {
                    setDeleteIndex(idx);
                    setShowDeleteModal(true);
                  }}
                />
              </div>
            ) : null}
          </div>

          {/* Candidates */}
          <div className="flex flex-col gap-4">
            {poll.candidates.map((c, i) => (
              <div key={i} className="w-full rounded-xl p-2 sm:p-4 flex items-center justify-between gap-4 shadow-[0_0_14px_0_rgba(0,0,0,0.1)]">
                <div className="flex items-center gap-4">
                  <img src={c.image} alt={c.name} className="w-[60px] h-[60px] object-cover rounded-full" />
                  <p className="font-montserrat font-semibold text-black">{c.name}</p>
                </div>
                
                <div className="flex items-center gap-4">
                  {isDirector && (
                    <div className="flex items-center gap-2">
                      <img src={mediaData.Votingbox} alt="vote" className="w-6 h-6" />
                      <span className="text-grey font-semibold">{c.votes} {c.votes > 1 ? "Votes" : "Vote"}</span>
                    </div>
                  )}
                  
                  {/* Vote Button - Hidden for Admins and Candidates */}
                  {!isDirector && !isCandidate && (
                    !poll.votedUsers?.includes(auth.user?.id) && activeTab !== "completed" ? (
                      <button
                        onClick={() => handleVote(idx, i)}
                        className="bg-primary text-white text-sm px-4 py-2 rounded-lg hover:bg-opacity-90 transition font-montserrat font-semibold shadow-sm"
                      >
                        Vote
                      </button>
                    ) : (
                      <button
                        disabled
                        className="bg-gray-300 text-white text-sm px-4 py-2 rounded-lg cursor-not-allowed font-montserrat font-semibold"
                      >
                        {activeTab === "completed" ? "Ended" : "Voted"}
                      </button>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      );
    })
  )}
</div>



        )}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <Customcard
          heading="Delete Voting Poll"
          content={<div>Are you sure you want to delete this poll? <br /> This action cannot be undone.</div>}
          button1Text={<div className="flex items-center justify-center gap-2"><img src={mediaData.Cancel} alt="cancel" className="w-5 h-5" /><span>No, Cancel</span></div>}
          button2Text={<div className="flex items-center justify-center gap-2"><img src={mediaData.Trash} alt="delete" className="w-5 h-5" /><span>Yes, Delete</span></div>}
          button1Bg="bg-grey"
          button2Bg="bg-[#E30000]"
          onButton1Click={() => setShowDeleteModal(false)}
          onButton2Click={() => {
            const current = polls[deleteIndex];
            if (isDirector && current?.id) {
              apiRequest(`/content/votes/${current.id}`, { method: "DELETE", token: auth.token }).catch(() => {});
            }
            const updatedPolls = [...polls];
            updatedPolls.splice(deleteIndex, 1);
            setPolls(updatedPolls);
            setShowDeleteModal(false);
          }}
          onClose={() => setShowDeleteModal(false)}
        />
      )}
{/* Discard / Delete Modal */}
{showDiscardModal && (
  <Customcard
    heading={isCancelDiscard ? "Discard Poll" : "Delete Poll"}
    content={
      <div>
        {isCancelDiscard
          ? "Are you sure you want to discard this poll? This action cannot be undone."
          : "Are you sure you want to delete this poll? This action cannot be undone."}
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
    onButton2Click={() => {
      if (isCancelDiscard) {
        setShowForm(false);
        setPollName("");
        setPollDesc("");
        setTargetRole("other");
        setEndDate("");
        setCandidates([
          { name: "", image: mediaData.Camera, votes: 0 },
          { name: "", image: mediaData.Camera, votes: 0 },
          { name: "", image: mediaData.Camera, votes: 0 },
        ]);
      } else {
        const updatedPolls = [...polls];
        updatedPolls.splice(deleteIndex, 1);
        setPolls(updatedPolls);
      }
      setShowDiscardModal(false);
    }}
  />
)}

      {/* Poll Created/Updated Modal */}
      {showImageModal && (
        <Imagemodal
          heading={modalType === "updated" ? "Poll Updated" : "Poll Created"}
          subheading={modalType === "updated" ? "Your poll has been updated." : "Your poll has been created."}
          onClose={() => setShowImageModal(false)}
        />
      )}
    </div>
  );
};
