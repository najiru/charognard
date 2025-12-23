import { ReactNode } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { LockIcon } from 'lucide-react';
import { VerifiedBadge } from './verified-badge';

interface ProfileCardUser {
  pk: string;
  username: string;
  full_name: string;
  profile_pic_url: string;
  is_verified?: boolean;
  is_private?: boolean;
}

interface ProfileCardProps {
  user: ProfileCardUser;
  leftSlot?: ReactNode;
  statusSlot?: ReactNode;
  infoSlot?: ReactNode;
  children?: ReactNode;
}

export function ProfileCard({ user, leftSlot, statusSlot, infoSlot, children }: ProfileCardProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent/50 transition-colors">
      {leftSlot}

      <a
        href={`https://www.instagram.com/${user.username}/`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Avatar className="size-12 cursor-pointer hover:opacity-80 transition-opacity">
          <AvatarImage src={user.profile_pic_url} alt={user.username} />
          <AvatarFallback>{user.username[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
      </a>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <a
            href={`https://www.instagram.com/${user.username}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-sm hover:underline truncate"
          >
            {user.username}
          </a>
          {user.is_verified && <VerifiedBadge />}
          {user.is_private && <LockIcon className="size-3.5 text-muted-foreground shrink-0" />}
          {statusSlot}
        </div>
        <p className="text-xs text-muted-foreground truncate">{user.full_name}</p>
        {infoSlot}
      </div>

      {children}
    </div>
  );
}
