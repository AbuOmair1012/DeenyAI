import { useQuery } from "@tanstack/react-query";
import { Users as UsersIcon } from "lucide-react";
import { adminApi } from "../hooks/useApi";

const MADHAB_NAMES: Record<string, string> = {
  hanafi: "Hanafi",
  maliki: "Maliki",
  shafii: "Shafi'i",
  hanbali: "Hanbali",
};

export default function Users() {
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: adminApi.getUsers,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Users</h1>

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
                <th className="text-left px-5 py-3 text-sm font-medium text-gray-500">
                  User
                </th>
                <th className="text-left px-5 py-3 text-sm font-medium text-gray-500">
                  Country
                </th>
                <th className="text-left px-5 py-3 text-sm font-medium text-gray-500">
                  Madhab
                </th>
                <th className="text-left px-5 py-3 text-sm font-medium text-gray-500">
                  Status
                </th>
                <th className="text-left px-5 py-3 text-sm font-medium text-gray-500">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user: any) => (
                <tr
                  key={user.id}
                  className="border-b border-gray-50 hover:bg-gray-50"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {(
                          user.firstName?.[0] ||
                          user.email[0]
                        ).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {user.firstName
                            ? `${user.firstName} ${user.lastName || ""}`
                            : user.email}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">
                    {user.country || "—"}
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">
                    {MADHAB_NAMES[user.madhab] || "—"}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${
                        user.onboardingComplete
                          ? "bg-green-50 text-green-700"
                          : "bg-yellow-50 text-yellow-700"
                      }`}
                    >
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
