import { useQuery } from "@tanstack/react-query";
import { Users, MessageSquare, BookOpen, Activity } from "lucide-react";
import { adminApi } from "../hooks/useApi";

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: adminApi.getStats,
  });

  const statCards = [
    {
      label: "Total Users",
      value: stats?.totalUsers ?? 0,
      icon: Users,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Chat Sessions",
      value: stats?.totalSessions ?? 0,
      icon: MessageSquare,
      color: "bg-green-50 text-green-600",
    },
    {
      label: "Total Messages",
      value: stats?.totalMessages ?? 0,
      icon: BookOpen,
      color: "bg-purple-50 text-purple-600",
    },
    {
      label: "Active Today",
      value: stats?.activeUsersToday ?? 0,
      icon: Activity,
      color: "bg-orange-50 text-orange-600",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {isLoading ? (
        <div className="text-gray-500">Loading stats...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="bg-white rounded-xl p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-500">
                  {card.label}
                </span>
                <div className={`p-2 rounded-lg ${card.color}`}>
                  <card.icon size={20} />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {card.value.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
