"use client";

export type DataScope = "Own" | "Subord" | "Dept" | "Org" | "None";

export interface PermissionRule {
  id: number;
  categoryCode: string;
  categoryName: string;
  code: string;
  name: string;
  description: string;
  isCritical: boolean;
  roles: {
    CEO: { allowed: boolean; scope: DataScope };
    GM: { allowed: boolean; scope: DataScope };
    HRD: { allowed: boolean; scope: DataScope };
    Supervisor: { allowed: boolean; scope: DataScope };
    Staff: { allowed: boolean; scope: DataScope };
    "Admin IT": { allowed: boolean; scope: DataScope };
  };
  note?: string;
}

export const RBAC_STORAGE_KEY = "j_absen_rbac_matrix";

/**
 * Mengambil matriks RBAC dari localStorage
 */
export function getStoredRbacMatrix(): PermissionRule[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(RBAC_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch (err) {
    console.warn("Gagal membaca matriks RBAC dari cache lokal:", err);
    return null;
  }
}

/**
 * Menyimpan matriks RBAC ke localStorage dan memancarkan event pembaruan
 */
export function saveStoredRbacMatrix(matrix: PermissionRule[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(RBAC_STORAGE_KEY, JSON.stringify(matrix));
    window.dispatchEvent(new Event("rbac-updated"));
  } catch (err) {
    console.warn("Gagal menyimpan matriks RBAC ke cache lokal:", err);
  }
}

/**
 * Menghapus cache matriks RBAC dan mengembalikan ke default
 */
export function clearStoredRbacMatrix(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(RBAC_STORAGE_KEY);
    window.dispatchEvent(new Event("rbac-updated"));
  } catch (err) {
    console.warn("Gagal menghapus cache matriks RBAC:", err);
  }
}

/**
 * Memeriksa apakah suatu role memiliki izin tertentu berdasarkan matriks tersimpan
 */
export function checkPermission(
  role: string,
  permissionCode: string,
  fallbackAllowed: boolean = true
): boolean {
  if (typeof window === "undefined") return fallbackAllowed;
  try {
    const matrix = getStoredRbacMatrix();
    if (!matrix) return fallbackAllowed;
    const rule = matrix.find((r) => r.code === permissionCode);
    if (!rule || !rule.roles) return fallbackAllowed;
    const roleConfig = (rule.roles as Record<string, { allowed: boolean; scope?: string }>)[role];
    if (!roleConfig) return fallbackAllowed;
    return roleConfig.allowed;
  } catch {
    return fallbackAllowed;
  }
}

/**
 * Menggabungkan (merge) data izin dari PostgreSQL ke dalam struktur matriks
 */
export function mergePermissionsWithDb(
  base: PermissionRule[],
  dbPermissions: Array<{ role: string; permission: string; isAllowed: boolean }>
): PermissionRule[] {
  if (!dbPermissions || dbPermissions.length === 0) return base;

  const dbMap = new Map<string, boolean>();
  dbPermissions.forEach((item) => {
    dbMap.set(`${item.role}_${item.permission}`, item.isAllowed);
  });

  return base.map((rule) => {
    const nextRoles = { ...rule.roles };
    let hasChanged = false;

    for (const [rName, rConfig] of Object.entries(nextRoles)) {
      const key = `${rName}_${rule.code}`;
      if (dbMap.has(key)) {
        const allowed = dbMap.get(key)!;
        if (rConfig.allowed !== allowed) {
          hasChanged = true;
          (nextRoles as any)[rName] = {
            ...rConfig,
            allowed,
            scope: allowed ? (rConfig.scope !== "None" ? rConfig.scope : "Org") : "None",
          };
        }
      }
    }

    return hasChanged ? { ...rule, roles: nextRoles } : rule;
  });
}
