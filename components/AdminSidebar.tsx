"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { User } from "@supabase/supabase-js";
import {
  LayoutDashboard,
  Images,
  Film,
  Home,
  Settings,
  LogOut,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
  { icon: Home, label: "Homepage", href: "/admin/homepage" },
  { icon: Images, label: "Galleries", href: "/admin/galleries" },
  { icon: Film, label: "Films", href: "/admin/films" },
  { icon: Settings, label: "Settings", href: "/admin/settings" },
];

export default function AdminSidebar({ user }: { user: User }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <aside className="admin-sidebar w-64 flex flex-col flex-shrink-0 h-full">
      {/* Logo */}
      <div className="px-6 py-7 border-b border-stone-warm/8">
        <Link href="/admin" className="block">
          <p className="font-display text-ivory tracking-[0.12em] uppercase text-sm">
            Misty Visuals
          </p>
          <p className="text-label-sm text-cinematic-gold/70 mt-0.5">
            Content Studio
          </p>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "admin-nav-item relative",
                isActive && "active"
              )}
            >
              <item.icon size={15} />
              <span className="flex-1">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="admin-nav-indicator"
                  className="absolute right-3"
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                >
                  <ChevronRight size={12} className="text-cinematic-gold" />
                </motion.div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="px-3 pb-6 border-t border-stone-warm/8 pt-4 space-y-2">
        <div className="px-3 py-2">
          <p className="text-label-sm text-stone-warm/50 truncate">
            {user.email}
          </p>
        </div>
        <button
          onClick={handleSignOut}
          className="admin-nav-item w-full text-left hover:text-red-400/70"
          id="admin-signout"
        >
          <LogOut size={15} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
