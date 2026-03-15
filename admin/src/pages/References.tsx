import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Search, X } from "lucide-react";
import { adminApi } from "../hooks/useApi";

const SOURCE_TYPES = [
  { value: "quran", label: "Quran" },
  { value: "hadith", label: "Hadith" },
  { value: "fatwa", label: "Fatwa" },
  { value: "scholarly_opinion", label: "Scholarly Opinion" },
  { value: "ijma", label: "Ijma (Consensus)" },
];

const MADHABS = [
  { value: "", label: "All Madhabs" },
  { value: "hanafi", label: "Hanafi" },
  { value: "maliki", label: "Maliki" },
  { value: "shafii", label: "Shafi'i" },
  { value: "hanbali", label: "Hanbali" },
];

interface RefForm {
  title: string;
  titleAr: string;
  content: string;
  contentAr: string;
  source: string;
  sourceType: string;
  madhab: string;
  country: string;
  tags: string;
}

const emptyForm: RefForm = {
  title: "",
  titleAr: "",
  content: "",
  contentAr: "",
  source: "",
  sourceType: "hadith",
  madhab: "",
  country: "",
  tags: "",
};

export default function References() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterMadhab, setFilterMadhab] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RefForm>(emptyForm);

  const { data: refs = [], isLoading } = useQuery({
    queryKey: ["references", search, filterMadhab],
    queryFn: () => {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (filterMadhab) params.madhab = filterMadhab;
      return adminApi.getReferences(params);
    },
  });

  const createMut = useMutation({
    mutationFn: (data: any) => adminApi.createReference(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["references"] });
      closeForm();
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      adminApi.updateReference(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["references"] });
      closeForm();
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => adminApi.deleteReference(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["references"] }),
  });

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const openEdit = (ref: any) => {
    setForm({
      title: ref.title || "",
      titleAr: ref.titleAr || "",
      content: ref.content || "",
      contentAr: ref.contentAr || "",
      source: ref.source || "",
      sourceType: ref.sourceType || "hadith",
      madhab: ref.madhab || "",
      country: ref.country || "",
      tags: (ref.tags || []).join(", "),
    });
    setEditingId(ref.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...form,
      madhab: form.madhab || null,
      country: form.country || null,
      tags: form.tags
        ? form.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
        : null,
    };

    if (editingId) {
      updateMut.mutate({ id: editingId, data });
    } else {
      createMut.mutate(data);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this reference?")) {
      deleteMut.mutate(id);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          References Database
        </h1>
        <button
          onClick={() => {
            setForm(emptyForm);
            setEditingId(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus size={18} /> Add Reference
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search references..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          />
        </div>
        <select
          value={filterMadhab}
          onChange={(e) => setFilterMadhab(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary"
        >
          {MADHABS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">
                {editingId ? "Edit Reference" : "Add Reference"}
              </h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title (English) *
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title (Arabic)
                  </label>
                  <input
                    type="text"
                    value={form.titleAr}
                    onChange={(e) =>
                      setForm({ ...form, titleAr: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
                    dir="rtl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content (English) *
                </label>
                <textarea
                  value={form.content}
                  onChange={(e) =>
                    setForm({ ...form, content: e.target.value })
                  }
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content (Arabic)
                </label>
                <textarea
                  value={form.contentAr}
                  onChange={(e) =>
                    setForm({ ...form, contentAr: e.target.value })
                  }
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
                  dir="rtl"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Source *
                  </label>
                  <input
                    type="text"
                    value={form.source}
                    onChange={(e) =>
                      setForm({ ...form, source: e.target.value })
                    }
                    placeholder="e.g., Sahih Bukhari, Imam Nawawi..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Source Type *
                  </label>
                  <select
                    value={form.sourceType}
                    onChange={(e) =>
                      setForm({ ...form, sourceType: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
                  >
                    {SOURCE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Madhab (optional)
                  </label>
                  <select
                    value={form.madhab}
                    onChange={(e) =>
                      setForm({ ...form, madhab: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Universal (All madhabs)</option>
                    <option value="hanafi">Hanafi</option>
                    <option value="maliki">Maliki</option>
                    <option value="shafii">Shafi'i</option>
                    <option value="hanbali">Hanbali</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country (optional)
                  </label>
                  <input
                    type="text"
                    value={form.country}
                    onChange={(e) =>
                      setForm({ ...form, country: e.target.value })
                    }
                    placeholder="e.g., SA, EG (ISO code)"
                    maxLength={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) =>
                    setForm({ ...form, tags: e.target.value })
                  }
                  placeholder="e.g., prayer, fasting, zakat"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMut.isPending || updateMut.isPending}
                  className="px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
                >
                  {editingId ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="text-gray-500">Loading...</div>
      ) : refs.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <BookOpenIcon />
          <p className="mt-4 text-lg">No references found</p>
          <p className="text-sm">Add your first reference to get started</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-sm font-medium text-gray-500">
                  Title
                </th>
                <th className="text-left px-5 py-3 text-sm font-medium text-gray-500">
                  Source
                </th>
                <th className="text-left px-5 py-3 text-sm font-medium text-gray-500">
                  Type
                </th>
                <th className="text-left px-5 py-3 text-sm font-medium text-gray-500">
                  Madhab
                </th>
                <th className="text-left px-5 py-3 text-sm font-medium text-gray-500">
                  Status
                </th>
                <th className="text-right px-5 py-3 text-sm font-medium text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {refs.map((ref: any) => (
                <tr key={ref.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <div className="font-medium text-gray-900 truncate max-w-xs">
                      {ref.title}
                    </div>
                    {ref.titleAr && (
                      <div className="text-sm text-gray-500 truncate" dir="rtl">
                        {ref.titleAr}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">
                    {ref.source}
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-block bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">
                      {ref.sourceType}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">
                    {ref.madhab || "All"}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${
                        ref.isActive
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {ref.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => openEdit(ref)}
                      className="text-gray-400 hover:text-primary p-1"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(ref.id)}
                      className="text-gray-400 hover:text-red-500 p-1 ml-2"
                    >
                      <Trash2 size={16} />
                    </button>
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

function BookOpenIcon() {
  return (
    <svg
      className="mx-auto h-12 w-12 text-gray-300"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    </svg>
  );
}
