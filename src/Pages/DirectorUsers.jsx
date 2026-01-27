import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { apiRequest } from "../auth/api";
import { toast } from "sonner";
import { CustomToast } from "../components/CustomToast";
import { Table } from "../components/Table";
import { mediaData } from "../utils/mediaData";

export const DirectorUsers = () => {
  const auth = useAuth();
  const [users, setUsers] = useState([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("principal");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const loadUsers = useCallback(async () => {
    const data = await apiRequest("/director/users", {
      token: auth.token,
    });
    setUsers(data.users || []);
  }, [auth.token]);

  useEffect(() => {
    loadUsers().catch(() => {});
  }, [loadUsers]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!email || !password || !role) {
      toast.custom((t) => <CustomToast id={t} message="Please fill all fields" type="error" />);
      return;
    }
    try {
      await apiRequest("/director/users", {
        method: "POST",
        token: auth.token,
        body: { email, password, role },
      });
      setEmail("");
      setPassword("");
      setRole("principal");
      toast.custom((t) => <CustomToast id={t} message="User created" type="success" />);
      await loadUsers();
      setShowCreateForm(false);
    } catch (err) {
      // Toast handled in apiRequest
    }
  };

  const columns = [
    { header: "Email", key: "Email" },
    { header: "Role", key: "Role" },
    { header: "Password", key: "Password" },
    { header: "Created At", key: "CreatedAt" },
  ];

  const tableData = users.map((u) => ({
    Email: { type: "text", value: u.email },
    Role: {
      type: "text",
      value: u.role
        ? u.role
            .replace(/_/g, " ")
            .toLowerCase()
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")
        : "",
    },
    Password: { type: "text", value: "••••••" },
    CreatedAt: { type: "text", value: u.created_at },
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
            No Users Available Yet...
          </h3>
          <p className="font-montserrat font-normal text-[14px] text-center text-grey">
            Create a user to see them here.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full">
      {!showCreateForm ? (
        <Table
          title="User Management"
          buttonText="Create User"
          onButtonClick={() => setShowCreateForm(true)}
          columns={columns}
          data={tableData}
          emptyState={emptyState}
        />
      ) : (
        <div className="flex flex-col w-full gap-6 bg-white font-montserrat rounded-3xl h-full p-4 sm:p-6 items-start font-montserrat">
          <h2 className="w-full text-black font-semibold text-[20px] border-b pb-2">
            Create User
          </h2>

          <form onSubmit={handleCreate} className="flex flex-col w-full gap-6 shadow-md p-4 rounded-md">
            <div className="flex flex-col gap-2">
              <label className="font-semibold text-grey">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-lg bg-gray-200 px-4 py-2 text-black font-nunito focus:outline-none"
              >
                <option value="principal">Principal</option>
                <option value="teacher">Teacher</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-semibold text-grey">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                className="w-full rounded-lg bg-gray-200 px-4 py-2 text-black font-nunito focus:outline-none"
                placeholder="user@example.com"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-semibold text-grey">Password</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
                className="w-full rounded-lg bg-gray-200 px-4 py-2 text-black font-nunito focus:outline-none"
                placeholder="Set a password"
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 w-full mt-4">
              <button
                type="button"
                className="w-full sm:w-auto px-6 sm:px-[75px] py-2 bg-grey text-white rounded-3xl font-semibold"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-6 sm:px-[50px] py-2 bg-primary text-white rounded-3xl font-semibold"
              >
                Create User
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
