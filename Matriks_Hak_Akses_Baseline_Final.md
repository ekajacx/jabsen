# MATRIKS HAK AKSES BASELINE FINAL – J-ABSEN

**Dokumen:** Matriks Hak Akses Baseline Final v1.0  
**Status:** **FINAL & DISEPAKATI RESMI** (Resolusi P-12, K-1 s.d. K-15, P-1 s.d. P-19)  
**Tanggal:** 18 November 2026  
**Platform:** Web Application J-Absen  

---

## 1. Prinsip Penegakan Hak Akses

1. **Deny-by-Default & Least Privilege:** Hak akses hanya aktif jika secara eksplisit diberikan konfigurasi `ALLOW`. Tidak ada hak akses otomatis berdasarkan nama jabatan atau nama role semata.
2. **Backend/Server-Side Authorization:** Seluruh pengecekan permission dan data scope divalidasi pada setiap API endpoint / controller di sisi server. Menyembunyikan menu atau tombol di UI bukan kontrol keamanan.
3. **Pemisahan Hak Administratif vs Approval Bisnis:**
   - **Admin IT** memegang hak penuh pengelolaan teknis & administratif sistem pada tahap awal (P-2).
   - Seluruh permission **Approval Bisnis** (Cuti, Koreksi Absensi, Review Enrollment Wajah) berstatus **DENY secara default bagi semua pihak termasuk Admin IT** (P-13).
   - Admin IT hanya dapat memperoleh hak approval bisnis jika secara eksplisit diberikan oleh **CEO** melalui permission khusus `admin_it.grant_approval`, dengan masa berlaku dan audit trail ketat (P-16).
4. **Pembatasan Hierarki Approval:**
   - Dilarang keras *self-approval*.
   - Approver tidak boleh menyetujui permohonan atasannya (Supervisor tidak boleh approve GM/CEO; GM tidak boleh approve CEO; Staff tidak boleh approve atasan).
5. **Data Scope Dinamis:**
   - `Own`: Data milik sendiri.
   - `Direct Subordinates`: Bawahan langsung yang melapor via `reports_to`.
   - `Descendants`: Seluruh bawahan bertingkat.
   - `Department`: Karyawan dalam satu departemen.
   - `Selected Departments`: Karyawan pada departemen tertentu yang dipilih.
   - `Organization`: Seluruh data perusahaan.
   - `Custom Scope`: Penugasan khusus dengan batas waktu `valid_from` s.d. `valid_to`.

---

## 2. Legenda Status Sel

| Simbol | Status | Keterangan |
|---|---|---|
| **ALLOW (Scope)** | Diizinkan | Diberikan akses aktif dengan batasan cakupan data (*Scope*). |
| **DENY** | Ditolak | Tidak memiliki hak akses; aksi diblokir oleh otorisasi server. |
| **[CRITICAL]** | Aksi Kritis | Memerlukan validasi ulang kredensial (*Re-Authentication*, grace period 10 menit). |

---

## 3. Matriks Hak Akses Baseline Final

| No | Modul & Permission | CEO | GM | HR / Admin HR | Supervisor | Staff | Admin IT | Catatan & Penegakan Otorisasi |
|:---:|---|:---:|:---:|:---:|:---:|:---:|:---:|---|
| **A** | **Autentikasi & Akun Pribadi** | | | | | | | |
| 1 | `auth.login_logout` | ALLOW (Own) | ALLOW (Own) | ALLOW (Own) | ALLOW (Own) | ALLOW (Own) | ALLOW (Own) | Sesi mandiri, validasi status akun aktif |
| 2 | `auth.update_profile` | ALLOW (Own) | ALLOW (Own) | ALLOW (Own) | ALLOW (Own) | ALLOW (Own) | ALLOW (Own) | Ubah info kontak mandiri |
| **B** | **Manajemen Karyawan (Employee)** | | | | | | | |
| 3 | `employee.view` | ALLOW (Org) | ALLOW (Org) | ALLOW (Org) | ALLOW (Dept) | ALLOW (Own) | ALLOW (Org) | Ringkasan/detail karyawan sesuai scope |
| 4 | `employee.create` | DENY | DENY | ALLOW (Org) | DENY | DENY | ALLOW (Org) | Tambah data karyawan baru |
| 5 | `employee.update` | DENY | DENY | ALLOW (Org) | DENY | DENY | ALLOW (Org) | Edit data personal & administrasi |
| 6 | `employee.deactivate` | DENY | DENY | ALLOW (Org) | DENY | DENY | **ALLOW (Org) [CRITICAL]** | Nonaktifkan / arsipkan karyawan |
| 7 | `employee.assign_org` | DENY | DENY | ALLOW (Org) | DENY | DENY | ALLOW (Org) | Assign departemen, jabatan, supervisor |
| **C** | **Akun Login & Hak Akses (RBAC)** | | | | | | | |
| 8 | `account.create_activate` | DENY | DENY | ALLOW (Org) | DENY | DENY | ALLOW (Org) | Pembuatan username & aktivasi akun |
| 9 | `account.reset_credential` | DENY | DENY | DENY | DENY | DENY | **ALLOW (Org) [CRITICAL]** | Reset password akun pengguna |
| 10 | `account.deactivate` | DENY | DENY | DENY | DENY | DENY | **ALLOW (Org) [CRITICAL]** | Nonaktifkan akun pengguna |
| 11 | `rbac.manage_roles` | DENY | DENY | DENY | DENY | DENY | **ALLOW (Org) [CRITICAL]** | Buat/ubah role & konfigurasi permission |
| 12 | `rbac.assign_user_role` | DENY | DENY | DENY | DENY | DENY | **ALLOW (Org) [CRITICAL]** | Tetapkan role pada akun karyawan |
| 13 | `rbac.grant_admin_it_approval`| **ALLOW (Org) [CRITICAL]** | DENY | DENY | DENY | DENY | DENY | Hak eksklusif CEO memberi approval ke IT |
| **D** | **Enrollment & Biometrik Wajah** | | | | | | | |
| 14 | `face.register_self` | ALLOW (Own) | ALLOW (Own) | ALLOW (Own) | ALLOW (Own) | ALLOW (Own) | ALLOW (Own) | Registrasi wajah kamera desktop/mobile |
| 15 | `face.view_status` | ALLOW (Org) | ALLOW (Org) | ALLOW (Org) | ALLOW (Dept) | ALLOW (Own) | ALLOW (Org) | Pantau status enrollment wajah |
| 16 | `face.review_approval` | DENY | DENY | ALLOW (Org) | DENY | DENY | **DENY (Default P-19)** | Review setujui/tolak registrasi wajah |
| 17 | `face.reset_template` | DENY | DENY | DENY | DENY | DENY | **ALLOW (Org) [CRITICAL]** | Reset template wajah bila ada kendala |
| **E** | **Absensi & Verifikasi Kehadiran** | | | | | | | |
| 18 | `attendance.check_in_out` | ALLOW (Own) | ALLOW (Own) | ALLOW (Own) | ALLOW (Own) | ALLOW (Own) | ALLOW (Own) | Absen masuk/pulang + 4 tantangan + GPS |
| 19 | `attendance.view_own_history` | ALLOW (Own) | ALLOW (Own) | ALLOW (Own) | ALLOW (Own) | ALLOW (Own) | ALLOW (Own) | Riwayat pencatatan waktu pribadi |
| 20 | `attendance.monitoring` | ALLOW (Org) | ALLOW (Org) | ALLOW (Org) | ALLOW (Dept) | DENY | ALLOW (Org) | Live monitoring kehadiran harian |
| 21 | `attendance.manual_correction`| DENY | DENY | DENY | DENY | DENY | **ALLOW (Org) [CRITICAL]** | Koreksi manual darurat (Wajib Audit Log) |
| **F** | **Jadwal Kerja, Shift & Geofence** | | | | | | | |
| 22 | `schedule.view_own` | ALLOW (Own) | ALLOW (Own) | ALLOW (Own) | ALLOW (Own) | ALLOW (Own) | ALLOW (Own) | Kalender jadwal kerja pribadi |
| 23 | `schedule.view_team` | ALLOW (Org) | ALLOW (Org) | ALLOW (Org) | ALLOW (Dept) | DENY | ALLOW (Org) | Tinjau jadwal kerja tim |
| 24 | `schedule.assign` | DENY | DENY | ALLOW (Org) | DENY | DENY | ALLOW (Org) | Tetapkan shift / jadwal pada karyawan |
| 25 | `config.work_rule_shift` | DENY | DENY | DENY | DENY | DENY | **ALLOW (Org) [CRITICAL]** | Konfigurasi jam shift, toleransi telat |
| 26 | `config.office_geofence` | DENY | DENY | DENY | DENY | DENY | **ALLOW (Org) [CRITICAL]** | Kelola titik koordinat & radius meter |
| **G** | **Pengajuan & Approval Cuti** | | | | | | | |
| 27 | `leave.submit_own` | ALLOW (Own) | ALLOW (Own) | ALLOW (Own) | ALLOW (Own) | ALLOW (Own) | ALLOW (Own) | Ajukan cuti tahunan/khusus mandiri |
| 28 | `leave.approve_step1` | ALLOW (GM) | ALLOW (Spv) | DENY | ALLOW (Subord) | DENY | **DENY (Default P-13)** | Approval Cuti Tahap 1 sesuai hierarki |
| 29 | `leave.manage_quota` | DENY | DENY | ALLOW (Org) | DENY | DENY | ALLOW (Org) | Input/sesuaikan saldo cuti tahunan |
| **H** | **Koreksi Absensi** | | | | | | | |
| 30 | `correction.submit_own` | ALLOW (Own) | ALLOW (Own) | ALLOW (Own) | ALLOW (Own) | ALLOW (Own) | ALLOW (Own) | Ajukan koreksi data absensi sendiri |
| 31 | `correction.submit_behalf` | DENY | DENY | ALLOW (Org) | DENY | DENY | DENY | HRD ajukan atas nama karyawan |
| 32 | `correction.approve_step1` | ALLOW (GM) | ALLOW (Spv) | DENY | ALLOW (Subord) | DENY | **DENY (Default P-13)** | Approval Koreksi Tahap 1 (Atasan) |
| 33 | `correction.approve_step2` | DENY | DENY | ALLOW (Org) | DENY | DENY | **DENY (Default P-13)** | Approval Koreksi Tahap 2 (HRD) |
| **I** | **Workflow & Exception Engine** | | | | | | | |
| 34 | `workflow.configure` | DENY | DENY | DENY | DENY | DENY | **ALLOW (Org) [CRITICAL]** | Konfigurasi tahapan & aturan approver |
| 35 | `workflow.handle_exception` | DENY | DENY | DENY | DENY | DENY | ALLOW (Org) | Eskalasi permohonan timeout / stuck |
| **J** | **Dashboard, Laporan & Audit Log** | | | | | | | |
| 36 | `dashboard.view_company` | ALLOW (Org) | ALLOW (Org) | ALLOW (Org) | DENY | DENY | ALLOW (Org) | Ringkasan metrik eksekutif perusahaan |
| 37 | `dashboard.view_department` | ALLOW (Org) | ALLOW (Org) | ALLOW (Org) | ALLOW (Dept) | DENY | ALLOW (Org) | Ringkasan metrik kehadiran departemen |
| 38 | `report.view_attendance` | ALLOW (Org) | ALLOW (Org) | ALLOW (Org) | ALLOW (Dept) | DENY | ALLOW (Org) | Filter & tinjau laporan kehadiran |
| 39 | `report.export_excel` | ALLOW (Org) | ALLOW (Org) | ALLOW (Org) | ALLOW (Dept) | DENY | **ALLOW (Org) [CRITICAL]** | Unduh laporan kehadiran Excel (.xlsx) |
| 40 | `audit_log.view_all` | **ALLOW (Org)** | DENY | DENY | DENY | DENY | ALLOW (Org) | Tinjau riwayat audit log (CEO awasi IT)|
| 41 | `audit_log.export` | **ALLOW (Org) [CRITICAL]**| DENY | DENY | DENY | DENY | **ALLOW (Org) [CRITICAL]** | Ekspor log audit keamanan WORM |

---

## 4. Ketentuan Pengamanan Khusus

1. **Anti-Lockout Akun Admin IT (P-14):**
   - Wajib ada minimal **2 akun Admin IT aktif**. Sistem menolak penonaktifan atau pencabutan role pada akun Admin IT aktif terakhir.
   - Admin IT dilarang melakukan penonaktifan akun sendiri (*Self-Deactivation*) atau pencabutan role sendiri (*Self-Revocation*).
2. **Integritas WORM (Write Once, Read Many) Audit Log (P-15):**
   - Database hanya mengizinkan `INSERT` dan `SELECT` pada tabel `AUDIT_LOG`.
   - Modifikasi atau penghapusan data audit log (`UPDATE`, `DELETE`, `TRUNCATE`, `DROP`) diblokir permanen di level database.
   - CEO memiliki hak baca pengawasan independen (`audit_log.view_all`) untuk memantau semua aktivitas administratif Admin IT.
3. **Masa Berlaku Re-Authentication (P-7):**
   - Setiap eksekusi aksi berlabel `[CRITICAL]` mengaktifkan sesi verifikasi selama **10 menit**. Setelah 10 menit idle, password wajib dimasukkan kembali.

---
**End of Matriks Hak Akses Baseline Final v1.0**
