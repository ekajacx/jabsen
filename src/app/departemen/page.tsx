"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import {
  Building2,
  Network,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Users,
  Briefcase,
  Save,
  Laptop,
  Coins,
  Cpu,
  Megaphone,
  UserCheck,
  ShoppingBag,
} from "lucide-react";
import { useOrgData, Department } from "@/lib/org-data";

export default function DepartemenPage() {
  const {
    departments,
    positions,
    isLoaded,
    addDepartment,
    editDepartment,
    deleteDepartment,
  } = useOrgData();

  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleOpenAddModal = () => {
    setEditingDept(null);
    setFormCode("");
    setFormName("");
    setFormDesc("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (dept: Department) => {
    setEditingDept(dept);
    setFormCode(dept.code);
    setFormName(dept.name.replace("Departemen ", ""));
    setFormDesc(dept.description);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim() || !formName.trim()) return;

    if (editingDept) {
      editDepartment(editingDept.id, formCode, formName, formDesc);
      showToast("success", `Departemen '${formName}' berhasil diperbarui.`);
    } else {
      const created = addDepartment(formCode, formName, formDesc);
      showToast(
        "success",
        `Departemen '${created.name}' berhasil dibuat! Anda dapat menambahkan Kepala & Staff di halaman Struktur Organisasi.`
      );
    }
    setIsModalOpen(false);
  };

  const handleDelete = (dept: Department) => {
    if (confirm(`Apakah Anda yakin ingin menghapus '${dept.name}'? Seluruh posisi di bawahnya juga akan dihapus dari bagan hirarki.`)) {
      deleteDepartment(dept.id);
      showToast("success", `'${dept.name}' berhasil dihapus.`);
    }
  };

  const filteredDepts = departments.filter((d) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q) || d.description.toLowerCase().includes(q);
  });

  return (
    <AppLayout pageTitle="Manajemen Departemen">
      <div className="space-y-6">
        {/* HEADER MODUL */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex size-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">
                <Building2 className="size-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-2xl">
                  Manajemen Departemen Perusahaan
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
                  Kelola divisi & departemen. Departemen yang ditambahkan di sini akan otomatis muncul dan terhubung di bagan struktur organisasi.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/organisasi"
              className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 text-xs font-semibold shadow-xs transition-colors"
            >
              <Network className="size-3.5 text-emerald-500" />
              <span>Lihat di Bagan Hirarki</span>
              <ExternalLink className="size-3 text-gray-400" />
            </Link>

            <Button
              onClick={handleOpenAddModal}
              size="sm"
              className="rounded-full px-4 text-xs font-semibold shadow-sm"
            >
              <Plus className="size-3.5 mr-1" />
              Tambah Departemen
            </Button>
          </div>
        </div>

        {/* NOTIFIKASI TOAST */}
        {toastMessage && (
          <div
            className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm shadow-sm transition-all ${
              toastMessage.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
                : "border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {toastMessage.type === "success" ? (
                <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertTriangle className="size-4 shrink-0 text-red-600 dark:text-red-400" />
              )}
              <span className="font-medium text-xs sm:text-sm">{toastMessage.text}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-xs font-semibold underline hover:no-underline">
              Tutup
            </button>
          </div>
        )}

        {/* METRIK RINGKASAN */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-gray-200 dark:border-gray-800">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Departemen Aktif</span>
                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{departments.length}</p>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  Terkoneksi ke Hirarki
                </span>
              </div>
              <div className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
                <Building2 className="size-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Posisi Terdaftar</span>
                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{positions.length}</p>
                <span className="text-[10px] text-gray-400 font-medium">Dari Direktur hingga Staf</span>
              </div>
              <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                <Briefcase className="size-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Sinkronisasi Hirarki</span>
                <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">100%</p>
                <span className="text-[10px] text-emerald-600 font-medium">Otomatis Terhubung Real-Time</span>
              </div>
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                <Network className="size-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* PENCARIAN & DAFTAR DEPARTEMEN */}
        <Card className="border-gray-200 dark:border-gray-800">
          <CardHeader className="border-b border-gray-100 dark:border-gray-800/80 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">
                Daftar Departemen Operasional ({filteredDepts.length})
              </CardTitle>
              <CardDescription className="text-xs">
                Sesuai 6 pilar divisi perusahaan utama yang ditampilkan pada bagan pohon organisasi.
              </CardDescription>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 size-3.5 text-gray-400" />
              <Input
                placeholder="Cari kode atau nama departemen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[760px]">
                <thead className="border-b border-gray-200 bg-gray-50/75 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-3">No</th>
                    <th className="px-4 py-3">Kode</th>
                    <th className="px-4 py-3">Nama Departemen</th>
                    <th className="px-4 py-3">Deskripsi & Ruang Lingkup</th>
                    <th className="px-4 py-3 text-center">Jumlah Posisi</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredDepts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                        Tidak ada departemen yang sesuai dengan pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredDepts.map((dept, idx) => {
                      const memberPositions = positions.filter((p) => p.departmentId === dept.id);

                      return (
                        <tr key={dept.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40">
                          <td className="px-4 py-3 text-gray-400 font-mono text-[11px]">{idx + 1}</td>
                          <td className="px-4 py-3 font-mono font-bold text-brand-600 dark:text-brand-400">
                            {dept.code}
                          </td>
                          <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">
                            <div className="flex items-center gap-2">
                              <span className="size-2 rounded-full bg-emerald-500 inline-block" />
                              <span>{dept.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-400 max-w-xs truncate">
                            {dept.description}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant="secondary" size="sm" className="font-semibold">
                              {memberPositions.length} Posisi
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={`/organisasi`}
                                title="Lihat di Bagan Hirarki & Tambah Karyawan"
                                className="p-1.5 text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400"
                              >
                                <Network className="size-4" />
                              </Link>
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(dept)}
                                className="p-1.5 text-gray-500 hover:text-brand-600 dark:hover:text-brand-400"
                                title="Edit Departemen"
                              >
                                <Edit2 className="size-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(dept)}
                                className="p-1.5 text-gray-400 hover:text-red-500"
                                title="Hapus Departemen"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* MODAL TAMBAH / EDIT DEPARTEMEN */}
        <Dialog
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingDept ? "Edit Departemen" : "Tambah Departemen Baru"}
          description={
            editingDept
              ? "Ubah data departemen. Perubahan nama akan otomatis sinkron ke bagan hirarki."
              : "Tambahkan departemen baru. Penambahan Kepala dan Staff dilakukan di halaman Struktur Organisasi."
          }
          className="max-w-md text-xs"
        >
          <form onSubmit={handleSave} className="space-y-3.5 pt-2">
            <div>
              <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
                Kode Departemen *
              </label>
              <Input
                value={formCode}
                onChange={(e) => setFormCode(e.target.value)}
                placeholder="Contoh: LOG, LAB, PROD"
                className="text-xs font-mono uppercase"
                required
              />
            </div>

            <div>
              <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
                Nama Departemen *
              </label>
              <div className="relative">
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Logistik & Gudang / Laboratorium Faset"
                  className="text-xs"
                  required
                />
              </div>
              <span className="text-[10px] text-gray-400 mt-0.5 block">
                Sistem otomatis menambahkan awalan &apos;Departemen&apos; jika belum ada.
              </span>
            </div>

            <div>
              <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
                Deskripsi & Ruang Lingkup Kerja
              </label>
              <textarea
                rows={2}
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Penjelasan fungsi departemen ini..."
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-xs shadow-xs focus:border-brand-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                className="text-xs"
              >
                Batal
              </Button>
              <Button type="submit" size="sm" className="text-xs">
                <Save className="size-3.5 mr-1" />
                {editingDept ? "Simpan Perubahan" : "Simpan & Buat di Hirarki"}
              </Button>
            </div>
          </form>
        </Dialog>
      </div>
    </AppLayout>
  );
}
