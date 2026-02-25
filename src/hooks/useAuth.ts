// Re-export everything from the new context module for backward compatibility.
// All consumers can continue to `import { useAuth } from "../hooks/useAuth"`.
export { AuthContext, useAuth, useAuthProvider } from "../context/AuthContext";
export type { AuthContextType, AppUser } from "../context/AuthContext";
