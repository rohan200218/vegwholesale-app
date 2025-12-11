import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

async function fetchUser(): Promise<User | null> {
  const response = await fetch("/api/auth/user", {
    credentials: "include",
  });
  
  if (response.status === 401) {
    return null;
  }
  
  if (!response.ok) {
    throw new Error("Failed to fetch user");
  }
  
  return response.json();
}

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchInterval: false,
  });

  const login = () => {
    window.location.href = "/api/login";
  };

  const logout = () => {
    window.location.href = "/api/logout";
  };

  return {
    user: user ?? null,
    isLoading,
    isAuthenticated: !!user,
    error,
    login,
    logout,
  };
}
