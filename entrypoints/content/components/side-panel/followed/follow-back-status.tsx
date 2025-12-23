import { Tooltip, TooltipTrigger, TooltipPopup } from '@/components/ui/tooltip';
import { UserCheckIcon, UserXIcon, ClockIcon } from 'lucide-react';

interface FollowBackStatusProps {
  followedBack: boolean | null;
  lastCheckedAt?: number;
  container: HTMLElement;
}

function formatLastChecked(timestamp?: number): string {
  if (!timestamp) return 'Never checked';
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return 'Checked just now';
  if (minutes < 60) return `Checked ${minutes}m ago`;
  if (hours < 24) return `Checked ${hours}h ago`;
  if (days === 1) return 'Checked 1 day ago';
  return `Checked ${days} days ago`;
}

export function FollowBackStatus({ followedBack, lastCheckedAt, container }: FollowBackStatusProps) {
  if (followedBack === true) {
    return (
      <Tooltip>
        <TooltipTrigger className="cursor-default">
          <UserCheckIcon className="size-3.5 text-green-500 shrink-0" />
        </TooltipTrigger>
        <TooltipPopup container={container}>
          Follows you back • {formatLastChecked(lastCheckedAt)}
        </TooltipPopup>
      </Tooltip>
    );
  }

  if (followedBack === false) {
    return (
      <Tooltip>
        <TooltipTrigger className="cursor-default">
          <UserXIcon className="size-3.5 text-red-500 shrink-0" />
        </TooltipTrigger>
        <TooltipPopup container={container}>
          Not following back • {formatLastChecked(lastCheckedAt)}
        </TooltipPopup>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger className="cursor-default">
        <ClockIcon className="size-3.5 text-muted-foreground shrink-0" />
      </TooltipTrigger>
      <TooltipPopup container={container}>
        Status unknown • {formatLastChecked(lastCheckedAt)}
      </TooltipPopup>
    </Tooltip>
  );
}
