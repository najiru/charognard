import { createContext, useEffect, useState, type ReactNode } from 'react';

type Theme = 'dark' | 'light';

export interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType | null>(null);

interface ThemeProviderProps {
  children: ReactNode;
  container?: HTMLElement;
}

function detectInstagramTheme(): Theme {
  // Instagram uses __fb-dark-mode class on the html element for dark mode
  const isDark = document.documentElement.classList.contains('__fb-dark-mode');
  return isDark ? 'dark' : 'light';
}

function detectSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children, container }: ThemeProviderProps) {
  // Use Instagram theme detection when on Instagram, otherwise use system theme
  const isOnInstagram = window.location.hostname.includes('instagram.com');
  const [theme, setTheme] = useState<Theme>(() =>
    isOnInstagram ? detectInstagramTheme() : detectSystemTheme()
  );

  useEffect(() => {
    if (isOnInstagram) {
      // Watch for Instagram theme changes (__fb-dark-mode class on html)
      const observer = new MutationObserver(() => {
        const newTheme = detectInstagramTheme();
        setTheme(newTheme);
      });

      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
      });

      return () => observer.disconnect();
    } else {
      // Watch for system theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        setTheme(e.matches ? 'dark' : 'light');
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [isOnInstagram]);

  // Apply theme class to container (content script) or document (popup)
  useEffect(() => {
    if (container) {
      // For content script: apply to shadow DOM container
      container.classList.add('theme-root');
      if (theme === 'dark') {
        container.classList.add('dark');
      } else {
        container.classList.remove('dark');
      }
    } else {
      // For popup: apply to document root
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [container, theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div className={`theme-root ${theme === 'dark' ? 'dark' : ''}`}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}
