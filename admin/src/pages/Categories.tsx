import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, X, FolderTree } from "lucide-react";
import { adminApi } from "../hooks/useApi";

export default function Categories() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [parentId, setParentId] = useState("");

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: adminApi.getCategories,
  });

  const createMut = useMutation({
    mutationFn: (data: any) => adminApi.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      closeForm();
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      adminApi.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      closeForm();
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => adminApi.deleteCategory(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setName("");
    setNameAr("");
    setParentId("");
  };

  const openEdit = (cat: any) => {
    setName(cat.name);
    setNameAr(cat.nameAr || "");
    setParentId(cat.parentId || "");
    setEditingId(cat.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name,
      nameAr: nameAr || null,
      parentId: parentId || null,
    };

    if (editingId) {
      updateMut.mutate({ id: editingId, data });
    } else {
      createMut.mutate(data);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this category?")) {
      deleteMut.mutate(id);
    }
  };

  // Build tree structure
  const rootCategories = categories.filter((c: any) => !c.parentId);
  const getChildren = (parentId: string) =>
    categories.filter((c: any) => c.parentId === parentId);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <button
          onClick={() => {
            closeForm();
            setShowForm(true);
          }}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus size={18} /> Add Category
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">
                {editingId ? "Edit Category" : "Add Category"}
              </h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name (English) *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name (Arabic)
                </label>
                <input
                  type="text"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Category
                </label>
                <select
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">None (Top-level)</option>
                  {categories
                    .filter((c: any) => c.id !== editingId)
                    .map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
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

      {/* Category Tree */}
      {isLoading ? (
        <div className="text-gray-500">Loading...</div>
      ) : categories.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <FolderTree size={48} className="mx-auto text-gray-300" />
          <p className="mt-4 text-lg">No categories yet</p>
          <p className="text-sm">Create categories to organize your references</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-5 space-y-2">
          {rootCategories.map((cat: any) => (
            <CategoryNode
              key={cat.id}
              category={cat}
              getChildren={getChildren}
              onEdit={openEdit}
              onDelete={handleDelete}
              depth={0}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryNode({
  category,
  getChildren,
  onEdit,
  onDelete,
  depth,
}: {
  category: any;
  getChildren: (id: string) => any[];
  onEdit: (cat: any) => void;
  onDelete: (id: string) => void;
  depth: number;
}) {
  const children = getChildren(category.id);

  return (
    <div>
      <div
        className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-gray-50 group"
        style={{ paddingLeft: `${16 + depth * 24}px` }}
      >
        <div className="flex items-center gap-3">
          <FolderTree size={18} className="text-primary" />
          <span className="font-medium text-gray-900">{category.name}</span>
          {category.nameAr && (
            <span className="text-sm text-gray-500" dir="rtl">
              {category.nameAr}
            </span>
          )}
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <button
            onClick={() => onEdit(category)}
            className="text-gray-400 hover:text-primary p-1"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => onDelete(category.id)}
            className="text-gray-400 hover:text-red-500 p-1"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
      {children.map((child: any) => (
        <CategoryNode
          key={child.id}
          category={child}
          getChildren={getChildren}
          onEdit={onEdit}
          onDelete={onDelete}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}
