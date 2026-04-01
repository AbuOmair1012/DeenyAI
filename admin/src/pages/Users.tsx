import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users as UsersIcon, UserPlus, KeyRound, X } from "lucide-react";
import { adminApi } from "../hooks/useApi";

const MADHAB_NAMES: Record<string, string> = {
  hanafi: "Hanafi",
  maliki: "Maliki",
  shafii: "Shafi'i",
  hanbali: "Hanbali",
};

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function Users() {
  const queryClient = useQueryClient();
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: adminApi.getUsers,
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [passwordTarget, setPasswordTarget] = useState<{ id: string; email: string } | null>(null);

  // Add user form state
  const [newUser, setNewUser] = useState({ email: "", password: "", firstName: "", lastName: "", isAdmin: false });
  const [addError, setAddError] = useState("");

  // Set password form state
  const [newPassword, setNewPassword] = useState("");
  const [pwError, setPwError] = useState("");

  const createMutation = useMutation({
    mutationFn: adminApi.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setShowAddModal(false);
      setNewUser({ email: "", password: "", firstName: "", lastName: "", isAdmin: false });
      setAddError("");
    },
    onError: (e: any) => setAddError(e.message),
  });

  const passwordMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) => adminApi.setUserPassword(id, password),
    onSuccess: () => {
      setPasswordTarget(null);
      setNewPassword("");
      setPwError("");
    },
    onError: (e: any) => setPwError(e.message),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90"
        >
          <UserPlus size={16} />
          Add User
        </button>
      </div>

      {isLoading ? (
        <div className="text-gray-500">Loading...</div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <UsersIcon size={48} className="mx-auto text-gray-300" />
          <p className="mt-4 text-lg">No users yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-sm font-medium text-gray-500">User</th>
                <th className="text-left px-5 py-3 text-sm font-medium text-gray-500">Country</th>
                <th className="text-left px-5 py-3 text-sm font-medium text-gray-500">Madhab</th>
                <th className="text-left px-5 py-3 text-sm font-medium text-gray-500">Status</th>
                <th className="text-left px-5 py-3 text-sm font-medium text-gray-500">Joined</th>
                <th className="text-left px-5 py-3 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user: any) => (
                <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {(user.firstName?.[0] || user.email[0]).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {user.firstName ? `${user.firstName} ${user.lastName || ""}` : user.email}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">{user.country || "—"}</td>
                  <td className="px-5 py-4 text-sm text-gray-600">{MADHAB_NAMES[user.madhab] || "—"}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${user.onboardingComplete ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>
                      {user.onboardingComplete ? "Active" : "Onboarding"}
                    </span>
                    {user.isAdmin && (
                      <span className="ml-2 inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-purple-50 text-purple-700">
                        Admin
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => { setPasswordTarget({ id: user.id, email: user.email }); setNewPassword(""); setPwError(""); }}
                      className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 border border-gray-200 px-2.5 py-1.5 rounded-lg hover:border-gray-300"
                    >
                      <KeyRound size={13} />
                      Set Password
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <Modal title="Add User" onClose={() => { setShowAddModal(false); setAddError(""); }}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  value={newUser.firstName}
                  onChange={e => setNewUser(p => ({ ...p, firstName: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  value={newUser.lastName}
                  onChange={e => setNewUser(p => ({ ...p, lastName: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Optional"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
              <input
                type="email"
                value={newUser.email}
                onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="user@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password <span className="text-red-500">*</span></label>
              <input
                type="password"
                value={newUser.password}
                onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Min. 6 characters"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={newUser.isAdmin}
                onChange={e => setNewUser(p => ({ ...p, isAdmin: e.target.checked }))}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-sm text-gray-700">Grant admin privileges</span>
            </label>
            {addError && <p className="text-sm text-red-600">{addError}</p>}
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => { setShowAddModal(false); setAddError(""); }}
                className="flex-1 border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => createMutation.mutate(newUser)}
                disabled={createMutation.isPending}
                className="flex-1 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                {createMutation.isPending ? "Creating..." : "Create User"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Set Password Modal */}
      {passwordTarget && (
        <Modal title="Set Password" onClose={() => { setPasswordTarget(null); setPwError(""); }}>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Setting new password for <span className="font-medium text-gray-700">{passwordTarget.email}</span></p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password <span className="text-red-500">*</span></label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Enter new password"
              />
            </div>
            {pwError && <p className="text-sm text-red-600">{pwError}</p>}
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => { setPasswordTarget(null); setPwError(""); }}
                className="flex-1 border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => passwordMutation.mutate({ id: passwordTarget.id, password: newPassword })}
                disabled={passwordMutation.isPending}
                className="flex-1 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                {passwordMutation.isPending ? "Saving..." : "Update Password"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
