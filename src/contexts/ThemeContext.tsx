import React, { createContext, useContext, useState, useEffect } from 'react';

// Define the theme type 
type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme; // Current theme
  toggleTheme: () => void; // Function to toggle the theme
}

const ThemeContext = createContext<ThemeContextType | null>(null); // create the context and set the default value to null

// export the ThemeProvider component to the rest of the application
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => { // Set the default theme to dark
    const saved = localStorage.getItem('theme'); 
    return (saved as Theme) || 'dark'; // If there is a saved theme in the local storage, use it, otherwise use the default theme
  });

  // hook to update the theme in the local storage and the document
  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.classList.toggle('light-theme', theme === 'light');
    document.documentElement.classList.toggle('dark-theme', theme === 'dark');
  }, [theme]);

  // Function to toggle the theme
  const toggleTheme = () => {
    setTheme(current => current === 'dark' ? 'light' : 'dark'); // depending on the current theme, toggle it. Default to dark if the current theme is not dark
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Custom hook to use the theme context
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) { // If the context is not found, throw an error
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}