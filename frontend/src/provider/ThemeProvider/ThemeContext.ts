import { createContext } from 'react';

export type ThemeContextType = {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export default ThemeContext;
