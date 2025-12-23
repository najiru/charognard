import { useState, useEffect } from 'react';
import { ThemeProvider } from '@/contexts/theme';
import { AuthProvider } from './contexts/auth';
import { ToastProvider } from '@/components/ui/toast';
import { SidePanel } from './side-panel';
import { OnboardingModal } from './onboarding-modal';
import { FloatingButton } from './floating-button';
import { HideButtonContext } from './contexts/hide-button';
import { useSessionStorage } from './hooks/use-session-storage';

interface AppProps {
  container: HTMLElement;
}

export function App({ container }: AppProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHidden, setIsHidden] = useSessionStorage('charognard_button_hidden', false);

  const hideButton = () => {
    setIsHidden(true);
    setIsOpen(false);
  };

  // Listen for custom event to open panel (from content script)
  useEffect(() => {
    const handleOpenPanel = () => setIsOpen(true);
    document.addEventListener('charognard:open-panel', handleOpenPanel);
    return () => document.removeEventListener('charognard:open-panel', handleOpenPanel);
  }, []);

  return (
    <ThemeProvider container={container}>
      <AuthProvider>
        <ToastProvider position="bottom-left" container={container}>
          <HideButtonContext.Provider value={{ isHidden, hideButton }}>
            {/* Floating Toggle Button */}
            <FloatingButton
              isOpen={isOpen}
              isHidden={isHidden}
              onToggle={() => setIsOpen(!isOpen)}
              container={container}
            />

            {/* Backdrop */}
            {isOpen && (
              <div
                className="fixed inset-0 bg-black/20 z-9998 transition-opacity"
                onClick={() => setIsOpen(false)}
              />
            )}

            {/* Side Panel */}
            <SidePanel isOpen={isOpen} onClose={() => setIsOpen(false)} container={container} />

            {/* Onboarding Modal */}
            <OnboardingModal container={container} />
          </HideButtonContext.Provider>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
