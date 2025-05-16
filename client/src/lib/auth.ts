import { apiRequest } from "./queryClient";

export interface User {
  id: number;
  name: string;
  username: string;
  role: string;
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const response = await apiRequest("GET", "/api/auth/user");
    return await response.json();
  } catch (error) {
    return null;
  }
}

export async function loginUser(username: string, password: string): Promise<User> {
  const response = await apiRequest("POST", "/api/auth/login", { username, password });
  return await response.json();
}

export async function logoutUser(): Promise<void> {
  await apiRequest("POST", "/api/auth/logout");
}
