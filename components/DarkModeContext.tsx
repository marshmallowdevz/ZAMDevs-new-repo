import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface DarkModeContextType {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
}

const DarkModeContext = createContext<DarkModeContextType | undefined>(undefined);

export const useDarkMode = () => {
  const context = useContext(DarkModeContext);
  if (!context) {
    throw new Error('useDarkMode must be used within a DarkModeProvider');
  }
  return context;
};

export const DarkModeProvider = ({ children }: { children: ReactNode }) => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('darkMode');
      setDarkMode(stored === 'true');
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('darkMode', String(darkMode));
    }
  }, [darkMode]);

  return (
    <DarkModeContext.Provider value={{ darkMode, setDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
}; 