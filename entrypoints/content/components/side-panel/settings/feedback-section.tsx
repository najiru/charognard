import { Button } from '@/components/ui/button';
import { MessageCircleIcon, GithubIcon, HeartIcon } from 'lucide-react';
import APP from '@/constants/app';

export function FeedbackSection() {
  return (
    <div className="pt-6 border-t border-border">
      <h3 className="font-heading font-semibold text-base mb-4">Feedback & Support</h3>
      <div className="space-y-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start"
          onClick={() => (window.location.href = `https://www.instagram.com/direct/t/${APP.DEVELOPER.DM_THREAD_ID}/`)}
        >
          <MessageCircleIcon className="size-4" />
          Send me a DM
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start"
          onClick={() => window.open('https://github.com/antoinekm/charognard-instagram', '_blank')}
        >
          <GithubIcon className="size-4" />
          Contribute on GitHub
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start"
          onClick={() => window.open('https://github.com/sponsors/antoinekm', '_blank')}
        >
          <HeartIcon className="size-4" />
          Sponsor the project
        </Button>
      </div>
    </div>
  );
}
