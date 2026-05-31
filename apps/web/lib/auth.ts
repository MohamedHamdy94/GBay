import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function getAuthToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get("gbay_token")?.value;
  return token;
}

export async function requireAuth() {
  const token = await getAuthToken();
  if (!token) {
    redirect("/login");
  }
  return token;
}
