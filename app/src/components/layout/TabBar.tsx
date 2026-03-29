"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  BarChart2,
  Scale,
  Users,
  UserCircle,
  Activity,
} from "lucide-react";

const tabs = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { href: "/activity", icon: Activity, label: "Training" },
  { href: "/weight", icon: Scale, label: "Wiegen", center: true },
  { href: "/team", icon: Users, label: "Team" },
  { href: "/profile", icon: UserCircle, label: "Profil" },
];

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] backdrop-blur-xl"
         style={{ background: "var(--tab-bg)" }}>
      <div className="mx-auto flex max-w-[600px] items-start justify-around pt-2 pb-8">
        {tabs.map((tab) => {
          const isActive = pathname?.startsWith(tab.href);
          const Icon = tab.icon;

          if (tab.center) {
            return (
              <Link key={tab.href} href={tab.href}
                    className="flex flex-col items-center gap-1 -mt-5">
                <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full text-white"
                     style={{
                       background: "var(--gradient-primary)",
                       boxShadow: "var(--glow-primary)",
                     }}>
                  <Icon size={24} />
                </div>
                <span className="text-[10px] font-medium"
                      style={{
                        fontFamily: "var(--font-body)",
                        color: isActive ? "var(--primary)" : "var(--text-muted)",
                      }}>
                  {tab.label}
                </span>
              </Link>
            );
          }

          return (
            <Link key={tab.href} href={tab.href}
                  className="flex flex-col items-center gap-1 px-3 py-1">
              <Icon size={22}
                    style={{ color: isActive ? "var(--primary)" : "var(--text-muted)" }} />
              <span className="text-[10px] font-medium"
                    style={{
                      fontFamily: "var(--font-body)",
                      color: isActive ? "var(--primary)" : "var(--text-muted)",
                    }}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
