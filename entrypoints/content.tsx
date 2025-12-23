import { createRoot } from 'react-dom/client';
import { fetchSuggestions, followUser, unfollowUser } from '@/lib/instagram';
import { runAutomation } from '@/lib/automation';
import { toastManager } from '@/components/ui/toast';
import { MessageType, type ExtensionMessage, type MessageResponse } from '@/lib/types';
import { App } from './content/app';
import './content/style.css';

export default defineContentScript({
  matches: ['*://*.instagram.com/*'],
  cssInjectionMode: 'ui',

  async main(ctx) {
    // Message handler
    browser.runtime.onMessage.addListener(
      (message: ExtensionMessage, _sender, sendResponse: (response: MessageResponse) => void) => {
        handleMessage(message).then(sendResponse);
        return true;
      }
    );

    // Inject UI into page
    const ui = await createShadowRootUi(ctx, {
      name: 'ig-suggestions-panel',
      position: 'inline',
      onMount: (container) => {
        const root = createRoot(container);
        root.render(<App container={container} />);
        return root;
      },
      onRemove: (root) => {
        root?.unmount();
      },
    });

    ui.mount();
  },
});

async function handleMessage(message: ExtensionMessage): Promise<MessageResponse> {
  try {
    switch (message.type) {
      case MessageType.GetSuggestions: {
        const data = await fetchSuggestions();
        return { success: true, data };
      }
      case MessageType.FollowUser: {
        await followUser(message.userId);
        return { success: true };
      }
      case MessageType.UnfollowUser: {
        await unfollowUser(message.userId);
        return { success: true };
      }
      case MessageType.RunAutomation: {
        const result = await runAutomation();
        if (result.followedCount > 0 || result.unfollowedCount > 0) {
          toastManager.add({
            title: `Automation completed: ${result.followedCount} followed, ${result.unfollowedCount} unfollowed`,
            type: 'success',
          });
        }
        return { success: true, data: result };
      }
      case MessageType.OpenPanel: {
        document.dispatchEvent(new CustomEvent('charognard:open-panel'));
        return { success: true };
      }
      default:
        return { success: false, error: 'Unknown message type' };
    }
  } catch (error) {
    console.error('[Charognard] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
