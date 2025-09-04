// src/components/Context.js
import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState("");
  const [isMember, setIsMember] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasOffer, setHasOffer] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn, setIsLoggedIn,
        role, setRole,
        isMember, setIsMember,
        isAdmin, setIsAdmin,
        hasOffer, setHasOffer,
        hasApplied, setHasApplied
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
