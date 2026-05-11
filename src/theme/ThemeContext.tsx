import React, { createContext, useContext, useEffect, useState } from 'react';

import { Appearance } from 'react-native';

import { darkTheme, lightTheme } from './theme';

type ThemeType = typeof darkTheme;

type ThemeContextType = {
  theme: ThemeType;
  isDark: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: darkTheme,
  isDark: true,
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  // CHECK DEVICE THEME ON START
  const getDeviceTheme = () => Appearance.getColorScheme() === 'dark';

  const [isDark, setIsDark] = useState(getDeviceTheme());

  // LISTEN TO DEVICE THEME CHANGES LIVE
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setIsDark(colorScheme === 'dark');
    });

    return () => subscription.remove();
  }, []);

  // MANUAL TOGGLE
  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme: isDark ? darkTheme : lightTheme,
        isDark,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
