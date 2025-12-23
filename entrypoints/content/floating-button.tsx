import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipPopup } from '@/components/ui/tooltip';
import { useAuth } from './hooks/use-auth';
import { hasCompletedOnboarding } from '@/lib/storage';
import { CharognardIcon } from '@/components/icons/charognard-icon';
import APP from '@/constants/app';

interface FloatingButtonProps {
  isOpen: boolean;
  isHidden: boolean;
  onToggle: () => void;
  container: HTMLElement;
}

export function FloatingButton({ isOpen, isHidden, onToggle, container }: FloatingButtonProps) {
  const { isLoggedIn } = useAuth();
  const [showTooltip, setShowTooltip] = useState(false);

  // Check if onboarding is pending to show tooltip (only when logged in)
  useEffect(() => {
    const checkOnboarding = async () => {
      if (isLoggedIn !== true) {
        setShowTooltip(false);
        return;
      }
      const completed = await hasCompletedOnboarding();
      setShowTooltip(!completed);
    };
    checkOnboarding();
  }, [isLoggedIn]);

  if (isHidden) return null;

  return (
    <Tooltip open={showTooltip && !isOpen}>
      <TooltipTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              onToggle();
              setShowTooltip(false);
            }}
            className={`fixed bottom-36 md:bottom-24 right-8 z-9998 size-14! rounded-full before:rounded-full shadow-md ${
              isOpen ? 'border-foreground' : ''
            }`}
            title={APP.NAME}
          >
            <CharognardIcon className="size-6" />
          </Button>
        }
      />
      <TooltipPopup container={container} side="left" sideOffset={12}>
        Click here to open {APP.SHORT_NAME}
      </TooltipPopup>
    </Tooltip>
  );
}
