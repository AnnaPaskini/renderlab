'use client';

import UserMenu from '@/components/navbar/UserMenu';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

const tabs = [
  { name: 'Workspace', href: '/workspace' },
  { name: 'Inpaint', href: '/inpaint' },
  { name: 'Templates', href: '/custom?tab=templates' },
  { name: 'Collections', href: '/custom?tab=collections' },
  { name: 'History', href: '/history' },
  { name: 'Prompts Library', href: '/prompts' }
];

export function MainNavbar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <nav className="border-b border-white/10 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              // Extract base path and query params
              const [basePath, queryString] = href.split('?');
              const isActive = queryString
                ? pathname === basePath && searchParams.toString().includes(queryString)
                : pathname.startsWith(basePath);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "py-4 px-1 border-b-2 font-medium text-sm transition-colors",
                    isActive
                      ? "border-[#ff6b35] text-[#ff6b35]"
                      : "border-transparent text-gray-400 hover:text-white hover:border-gray-600"
                  )}
                >
                  {name}
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
