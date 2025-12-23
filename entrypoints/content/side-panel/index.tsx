import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTab, TabsPanel } from '@/components/ui/tabs';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from '@/components/ui/empty';
import { XIcon, UsersIcon, HeartIcon, SettingsIcon, LogInIcon, ExternalLinkIcon, RefreshCwIcon } from 'lucide-react';
import { useAuth } from '../hooks/use-auth';
import APP from '@/constants/app';
import { SuggestionsTab } from './suggestions';
import { FollowedTab } from './followed';
import { SettingsTab } from './settings';

interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  container: HTMLElement;
}

export function SidePanel({ isOpen, onClose, container }: SidePanelProps) {
  const [activeTab, setActiveTab] = useState<string | null>('suggestions');
  const { isLoggedIn, checkAuth } = useAuth();

  const isNotLoggedIn = isLoggedIn === false;

  return (
    <div
      className={`fixed top-0 right-0 h-full w-[380px] bg-background border-l border-border shadow-2xl transform transition-transform duration-300 ease-in-out z-9999 flex flex-col ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
        <h2 className="font-heading font-semibold text-lg">{APP.NAME}</h2>
        <Button variant="ghost" size="icon-sm" onClick={onClose}>
          <XIcon />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <div className="px-4 pt-2 shrink-0">
          <TabsList className="w-full">
            <TabsTab value="suggestions" className="flex-1">
              <UsersIcon className="size-4" />
              Suggestions
            </TabsTab>
            <TabsTab value="followed" className="flex-1">
              <HeartIcon className="size-4" />
              Followed
            </TabsTab>
            <TabsTab value="settings" className="flex-1">
              <SettingsIcon className="size-4" />
              Settings
            </TabsTab>
          </TabsList>
        </div>

        <TabsPanel value="suggestions" className="flex-1 flex flex-col min-h-0">
          {isNotLoggedIn ? (
            <Empty className="flex-1 border-0">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <LogInIcon />
                </EmptyMedia>
                <EmptyTitle>Not logged in</EmptyTitle>
                <EmptyDescription>
                  Please log in to Instagram to see suggestions.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => window.open('https://www.instagram.com/accounts/login/', '_blank')}>
                    <ExternalLinkIcon />
                    Open Instagram
                  </Button>
                  <Button size="sm" variant="outline" onClick={checkAuth}>
                    <RefreshCwIcon />
                    Refresh
                  </Button>
                </div>
              </EmptyContent>
            </Empty>
          ) : (
            <SuggestionsTab container={container} />
          )}
        </TabsPanel>

        <TabsPanel value="followed" className="flex-1 flex flex-col min-h-0">
          {isNotLoggedIn ? (
            <Empty className="flex-1 border-0">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <LogInIcon />
                </EmptyMedia>
                <EmptyTitle>Not logged in</EmptyTitle>
                <EmptyDescription>
                  Please log in to Instagram to manage followed profiles.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => window.open('https://www.instagram.com/accounts/login/', '_blank')}>
                    <ExternalLinkIcon />
                    Open Instagram
                  </Button>
                  <Button size="sm" variant="outline" onClick={checkAuth}>
                    <RefreshCwIcon />
                    Refresh
                  </Button>
                </div>
              </EmptyContent>
            </Empty>
          ) : (
            <FollowedTab container={container} />
          )}
        </TabsPanel>

        <TabsPanel value="settings" className="flex-1 flex flex-col min-h-0">
          {isNotLoggedIn ? (
            <Empty className="flex-1 border-0">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <LogInIcon />
                </EmptyMedia>
                <EmptyTitle>Not logged in</EmptyTitle>
                <EmptyDescription>
                  Please log in to Instagram to access settings.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => window.open('https://www.instagram.com/accounts/login/', '_blank')}>
                    <ExternalLinkIcon />
                    Open Instagram
                  </Button>
                  <Button size="sm" variant="outline" onClick={checkAuth}>
                    <RefreshCwIcon />
                    Refresh
                  </Button>
                </div>
              </EmptyContent>
            </Empty>
          ) : (
            <SettingsTab container={container} />
          )}
        </TabsPanel>
      </Tabs>
    </div>
  );
}
