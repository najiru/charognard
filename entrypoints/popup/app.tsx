import { Button } from '@/components/ui/button';
import { ThemeProvider } from '@/contexts/theme';
import { MessageType } from '@/lib/types';
import { ExternalLinkIcon } from 'lucide-react';
import { CharognardIcon } from '@/components/icons/charognard-icon';
import APP from '@/constants/app';

function AppContent() {
  const openPanel = async () => {
    const tabs = await browser.tabs.query({ url: '*://*.instagram.com/*' });

    if (tabs.length > 0 && tabs[0].id) {
      await browser.runtime.sendMessage({ type: MessageType.OpenPanel });
      await browser.tabs.update(tabs[0].id, { active: true });
      if (tabs[0].windowId) {
        await browser.windows.update(tabs[0].windowId, { focused: true });
      }
    } else {
      await browser.tabs.create({ url: 'https://www.instagram.com/' });
    }
  };

  return (
    <div className="w-72 p-6 flex flex-col items-center text-center gap-4">
      <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center">
        <CharognardIcon className="size-8 text-primary" />
      </div>

      <div className="space-y-1">
        <h1 className="font-heading text-lg font-semibold">{APP.SHORT_NAME}</h1>
        <p className="text-sm text-muted-foreground">
          Open Instagram to use the extension
        </p>
      </div>

      <Button onClick={openPanel} className="w-full">
        <ExternalLinkIcon className="size-4" />
        Open Instagram
      </Button>

      <p className="text-xs text-muted-foreground">
        The panel will appear on the right side of the screen
      </p>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
