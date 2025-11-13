'use client';

import UserMenu from '@/components/navbar/UserMenu';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { name: 'Workspace', href: '/workspace' },
  { name: 'Custom', href: '/custom' },
  { name: 'History', href: '/history' },
  { name: 'Prompts Library', href: '/prompts' }
];

export function MainNavbar() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-white/10 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const isActive = pathname.startsWith(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    "py-4 px-1 border-b-2 font-medium text-sm transition-colors",
                    isActive
                      ? "border-[#ff6b35] text-[#ff6b35]"
                      : "border-transparent text-gray-400 hover:text-white hover:border-gray-600"
                  )}
                >
                  {tab.name}
                </Link>
              );
            })}
          </div>

          {/* User Menu on the right */}
          <div className="py-2">
            <UserMenu />
          </div>
        </div>
      </div>
    </nav>
  );
}
