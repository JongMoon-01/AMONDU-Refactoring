export function getAuth() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return {
      userId: Number(payload.sub),
      email: payload.email,
      role: String(payload.role).toUpperCase(), // "ADMIN" | "STUDENT"
      token,
    };
  } catch {
    return null;
  }
}