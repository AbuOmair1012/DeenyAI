import { useState } from "react";
import { Route, Switch, Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  BookOpen,
  FolderTree,
  Users,
  LogOut,
} from "lucide-react";
import { isLoggedIn, clearToken } from "./hooks/useApi";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import References from "./pages/References";
import Categories from "./pages/Categories";
import UsersPage from "./pages/Users";

const NAV_ITEMS = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/references", label: "References", icon: BookOpen },
  { path: "/categories", label: "Categories", icon: FolderTree },
  { path: "/users", label: "Users", icon: Users },
];

export default function App() {
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());
  const [location] = useLocation();

  if (!loggedIn) {
    return <Login onLogin={() => setLoggedIn(true)} />;
  }

  const handleLogout = () => {
    clearToken();
    setLoggedIn(false);
  };

  return (
    <div className="min-h-screen flex bg-[#FAF8F5]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-2xl font-extrabold text-primary">DeenyAI</h1>
          <p className="text-xs text-gray-400 mt-1">Admin Dashboard</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.path === "/"
                ? location === "/"
                : location.startsWith(item.path);
            return (
              <Link key={item.path} href={item.path}>
                <div
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
                    isActive
                      ? "bg-primary text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <item.icon size={19} />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 w-full transition-colors"
          >
            <LogOut size={19} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/references" component={References} />
          <Route path="/categories" component={Categories} />
          <Route path="/users" component={UsersPage} />
        </Switch>
      </main>
    </div>
  );
}
