'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'pwa-install-dismissed';

export function PwaManager() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  // ثبت سرویس ورکر
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV !== 'production') return;

    const onLoad = () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.error('[v0] SW registration failed:', err);
      });
    };
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);

  // مدیریت رویداد نصب
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handler = (e: Event) => {
      e.preventDefault();
      const dismissed = localStorage.getItem(DISMISS_KEY);
      if (dismissed === 'true') return;
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowBanner(false);
  }

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, 'true');
    setShowBanner(false);
  }

  if (!showBanner) return null;

  return (
    <div className='fixed inset-x-0 bottom-0 z-50 p-4 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:max-w-sm'>
      <div className='flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-lg'>
        <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary'>
          <Download className='h-5 w-5' />
        </div>
        <div className='flex-1'>
          <p className='text-sm font-medium text-foreground'>نصب اپلیکیشن</p>
          <p className='text-xs text-muted-foreground'>برای دسترسی سریع‌تر، برنامه را نصب کنید.</p>
        </div>
        <Button
          size='sm'
          onClick={handleInstall}
          className='bg-primary text-primary-foreground'
        >
          نصب
        </Button>
        <Button
          size='icon'
          variant='ghost'
          onClick={handleDismiss}
          className='h-8 w-8'
          aria-label='بستن'
        >
          <X className='h-4 w-4' />
        </Button>
      </div>
    </div>
  );
}
