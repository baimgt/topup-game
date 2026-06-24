"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Pencil, Trash2, UserPlus, Shield, User, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { formatCurrency } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";

interface UserData {
  _id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  orderCount: number;
  totalSpent: number;
  createdAt: string;
}

// ── Edit User Modal ──────────────────────────────────────────────────────────
function EditUserModal({ user, onClose, onSaved }: { user: UserData; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ name: user.name, email: user.email, role: user.role, password: "" });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const token = localStorage.getItem("token");
    const body: Record<string, string> = { name: form.name, email: form.email, role: form.role };
    if (form.password) body.password = form.password;

    const res = await fetch(`/api/admin/users/${user._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.success) { toast.success("User berhasil diupdate"); onSaved(); onClose(); }
    else toast.error(data.error || "Gagal menyimpan");
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <Input label="Nama" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Role</label>
        <select
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value as "USER" | "ADMIN" })}
          className="w-full bg-gaming-accent border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
        >
          <option value="USER">User</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>
      <Input
        label="Password Baru (kosongkan jika tidak diubah)"
        type="password"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        placeholder="Min. 6 karakter"
      />
      <div className="flex gap-3 pt-2">
        <Button variant="secondary" className="flex-1" onClick={onClose}>Batal</Button>
        <Button variant="primary" className="flex-1" loading={saving} onClick={handleSave}>Simpan</Button>
      </div>
    </div>
  );
}

// ── User Table ───────────────────────────────────────────────────────────────
function UserTable({
  users, loading, onEdit, onDelete, onRefresh, pagination, page, setPage,
}: {
  users: UserData[]; loading: boolean; onEdit: (u: UserData) => void;
  onDelete: (u: UserData) => void; onRefresh: () => void;
  pagination: { total: number; totalPages: number }; page: number; setPage: (p: number) => void;
}) {
  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (users.length === 0) {
    return <div className="text-center py-16 text-gray-500 text-sm">Tidak ada data ditemukan</div>;
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black/20 border-b border-white/5">
              {["Pengguna", "Role", "Total Pesanan", "Total Belanja", "Bergabung", "Aksi"].map((h) => (
                <th key={h} className="text-gray-400 text-xs font-bold uppercase tracking-wider px-6 py-4 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map((u) => (
              <tr key={u._id} className="hover:bg-white/[0.03] transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] ${u.role === "ADMIN" ? "bg-gradient-to-br from-purple-500 to-blue-500 shadow-purple-500/20" : "bg-black/30 border border-white/5"}`}>
                      <span className="text-white text-sm font-black">{u.name?.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <div className="text-white text-sm font-bold group-hover:text-cyan-400 transition-colors">{u.name}</div>
                      <div className="text-gray-500 text-xs mt-0.5">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge variant={u.role === "ADMIN" ? "purple" : "default"} className="text-[10px] uppercase tracking-wider px-2.5 py-1">
                    {u.role === "ADMIN"
                      ? <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> Admin</span>
                      : <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> User</span>}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-white/5 text-gray-300 text-xs font-bold border border-white/10">
                    {u.orderCount || 0} Trx
                  </span>
                </td>
                <td className="px-6 py-4 text-white text-sm font-black tracking-tight">{formatCurrency(u.totalSpent || 0)}</td>
                <td className="px-6 py-4 text-gray-400 text-sm whitespace-nowrap">
                  {new Date(u.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1">
                    <button onClick={() => onEdit(u)} title="Edit user" className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDelete(u)} className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all" title="Hapus user">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
          <p className="text-gray-500 text-xs">Halaman {page} dari {pagination.totalPages} ({pagination.total} total)</p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>← Prev</Button>
            <Button variant="secondary" size="sm" onClick={() => setPage(Math.min(pagination.totalPages, page + 1))} disabled={page === pagination.totalPages}>Next →</Button>
          </div>
        </div>
      )}
    </>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function AdminUsersPage() {
  const [activeTab, setActiveTab] = useState<"USER" | "ADMIN">("USER");
  const [users, setUsers] = useState<UserData[]>([]);
  const [admins, setAdmins] = useState<UserData[]>([]);
  const [userPagination, setUserPagination] = useState({ total: 0, totalPages: 1 });
  const [adminPagination, setAdminPagination] = useState({ total: 0, totalPages: 1 });
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [userSearch, setUserSearch] = useState("");
  const [adminSearch, setAdminSearch] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [adminPage, setAdminPage] = useState(1);

  const [editUser, setEditUser] = useState<UserData | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<UserData | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchByRole = useCallback(async (role: "USER" | "ADMIN", search: string, page: number) => {
    const token = localStorage.getItem("token");
    const params = new URLSearchParams({ role, page: String(page), limit: "15" });
    if (search) params.set("search", search);
    const res = await fetch(`/api/admin/users?${params}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    return data.success ? data.data : { users: [], pagination: { total: 0, totalPages: 1 } };
  }, []);

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    const data = await fetchByRole("USER", userSearch, userPage);
    setUsers(data.users);
    setUserPagination(data.pagination);
    setLoadingUsers(false);
  }, [fetchByRole, userSearch, userPage]);

  const loadAdmins = useCallback(async () => {
    setLoadingAdmins(true);
    const data = await fetchByRole("ADMIN", adminSearch, adminPage);
    setAdmins(data.users);
    setAdminPagination(data.pagination);
    setLoadingAdmins(false);
  }, [fetchByRole, adminSearch, adminPage]);

  useEffect(() => { loadUsers(); }, [loadUsers]);
  useEffect(() => { loadAdmins(); }, [loadAdmins]);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/admin/users/${deleteConfirm._id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success) {
      toast.success("User berhasil dihapus");
      loadUsers();
      loadAdmins();
    } else {
      toast.error(data.error || "Gagal menghapus");
    }
    setDeleting(false);
    setDeleteConfirm(null);
  };

  const tabs = [
    { key: "USER" as const, label: "Data User", icon: <User className="w-4 h-4" />, count: userPagination.total },
    { key: "ADMIN" as const, label: "Data Admin", icon: <Shield className="w-4 h-4" />, count: adminPagination.total },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.02] backdrop-blur-md border border-white/5 p-6 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">Manajemen Pengguna</h1>
          <p className="text-gray-400 text-sm mt-1">Kelola hak akses dan detail {userPagination.total + adminPagination.total} pengguna terdaftar.</p>
        </div>
        <button onClick={() => { loadUsers(); loadAdmins(); }} className="relative z-10 flex items-center gap-2 bg-black/20 hover:bg-black/40 text-gray-300 hover:text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all border border-white/5 shadow-lg">
          <RefreshCw className="w-4 h-4" /> Refresh Data
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white/[0.02] backdrop-blur-md rounded-2xl border border-white/5 p-2 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab.key
                ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/25"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            {tab.icon}
            {tab.label}
            <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-lg border ${
              activeTab === tab.key ? "bg-black/20 border-white/10" : "bg-black/30 border-white/5"
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white/[0.02] backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden">
        {/* Search bar */}
        <div className="flex flex-col sm:flex-row items-center gap-4 p-5 border-b border-white/5">
          <div className="flex-1 w-full relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              value={activeTab === "USER" ? userSearch : adminSearch}
              onChange={(e) => {
                if (activeTab === "USER") { setUserSearch(e.target.value); setUserPage(1); }
                else { setAdminSearch(e.target.value); setAdminPage(1); }
              }}
              placeholder={`Cari nama atau email ${activeTab === "USER" ? "pengguna" : "admin"}...`}
              className="w-full bg-black/20 border border-white/5 rounded-xl pl-11 pr-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-shadow"
            />
          </div>
          {activeTab === "ADMIN" && (
            <button
              onClick={() => setEditUser({ _id: "", name: "", email: "", role: "ADMIN", orderCount: 0, totalSpent: 0, createdAt: "" })}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600/20 to-blue-600/20 hover:from-purple-600/30 hover:to-blue-600/30 text-white border border-white/10 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] hover:scale-105"
            >
              <UserPlus className="w-4 h-4 text-cyan-400" />
              Tambah Admin Baru
            </button>
          )}
        </div>

        {/* Table */}
        {activeTab === "USER" ? (
          <UserTable
            users={users}
            loading={loadingUsers}
            onEdit={setEditUser}
            onDelete={setDeleteConfirm}
            onRefresh={loadUsers}
            pagination={userPagination}
            page={userPage}
            setPage={setUserPage}
          />
        ) : (
          <UserTable
            users={admins}
            loading={loadingAdmins}
            onEdit={setEditUser}
            onDelete={setDeleteConfirm}
            onRefresh={loadAdmins}
            pagination={adminPagination}
            page={adminPage}
            setPage={setAdminPage}
          />
        )}
      </div>

      {/* Edit Modal */}
      <Modal open={!!editUser} onClose={() => setEditUser(null)} title={editUser?._id ? "Edit User" : "Tambah Admin"}>
        {editUser && (
          editUser._id ? (
            <EditUserModal user={editUser} onClose={() => setEditUser(null)} onSaved={() => { loadUsers(); loadAdmins(); }} />
          ) : (
            // Create new admin form
            <CreateAdminForm onClose={() => setEditUser(null)} onSaved={() => { loadAdmins(); setActiveTab("ADMIN"); }} />
          )
        )}
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Konfirmasi Hapus" size="sm">
        {deleteConfirm && (
          <div className="space-y-4">
            <p className="text-gray-300 text-sm">
              Yakin ingin menghapus user <span className="text-white font-semibold">{deleteConfirm.name}</span>?
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setDeleteConfirm(null)}>Batal</Button>
              <Button variant="danger" className="flex-1" loading={deleting} onClick={handleDelete}>Hapus</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ── Create Admin Form ────────────────────────────────────────────────────────
function CreateAdminForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name || !form.email || !form.password) { toast.error("Lengkapi semua field"); return; }
    setSaving(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, role: "ADMIN" }),
    });
    const data = await res.json();
    if (data.success) {
      // Update role to ADMIN
      const token = localStorage.getItem("token");
      await fetch(`/api/admin/users/${data.data.user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role: "ADMIN" }),
      });
      toast.success("Admin berhasil dibuat");
      onSaved();
      onClose();
    } else {
      toast.error(data.error || "Gagal membuat admin");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <Input label="Nama" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama admin" />
      <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="admin@email.com" />
      <Input label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min. 6 karakter" />
      <div className="flex gap-3 pt-2">
        <Button variant="secondary" className="flex-1" onClick={onClose}>Batal</Button>
        <Button variant="primary" className="flex-1" loading={saving} onClick={handleSave}>Buat Admin</Button>
      </div>
    </div>
  );
}
