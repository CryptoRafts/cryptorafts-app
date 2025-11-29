// Client-side admin utilities that don't import server-side functions

export const ADMIN_ALLOWLIST = [
  "anasshamsiggc@gmail.com",
  "ceo@cryptorafts.com",
  "anasshamsi@cryptorafts.com",
  "admin@cryptorafts.com",
  "support@cryptorafts.com"
]; // Static allowlist for client-side checks

export function isAdminEmailClient(email: string): boolean {
  return ADMIN_ALLOWLIST.includes(email.toLowerCase());
}

export async function verifyAdminAccess(token: string): Promise<boolean> {
  try {
    const response = await fetch("/api/admin/guard/complete", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return response.ok;
  } catch (error) {
    console.error("Admin verification failed:", error);
    return false;
  }
}

export async function verifyDepartmentAccess(token: string, department: string): Promise<boolean> {
  try {
    const response = await fetch("/api/dept/guard/complete", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ department })
    });
    return response.ok;
  } catch (error) {
    console.error("Department verification failed:", error);
    return false;
  }
}
