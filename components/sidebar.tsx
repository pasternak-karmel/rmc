"use client";

import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import {
  Activity,
  Bell,
  Calendar,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const routes = [
  {
    label: "Tableau de bord",
    icon: LayoutDashboard,
    href: "/dashboard",
    color: "text-sky-500",
  },
  {
    label: "Patients",
    icon: Users,
    href: "/patients",
    color: "text-violet-500",
  },
  {
    label: "Workflows",
    icon: ClipboardList,
    href: "/workflows",
    color: "text-pink-700",
  },
  {
    label: "Notifications",
    icon: Bell,
    href: "/notifications",
    color: "text-orange-500",
  },
  {
    label: "Rendez-vous",
    icon: Calendar,
    href: "/rendez-vous",
    color: "text-emerald-500",
  },
  // {
  //   label: "Analytique",
  //   icon: Activity,
  //   href: "/analytique",
  //   color: "text-blue-500",
  // },
];

interface SidebarProps {
  mobile?: boolean;
}

export default function Sidebar({ mobile = false }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div
      className={cn(
        "space-y-4 py-4 flex-col h-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 border-r",
        "transition-transform duration-300 ease-in-out",
        mobile ? "flex" : "hidden md:flex"
      )}
    >
      <div className="px-3 py-2 flex-1">
        <Link href="/" className="flex items-center pl-3 mb-10">
          <div className="relative w-8 h-8 mr-4 rounded-full bg-primary flex items-center justify-center">
            <Activity className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold">Health Care</h1>
        </Link>
        <div className="space-y-1">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-primary hover:bg-primary/10 rounded-lg transition",
                pathname.startsWith(route.href)
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground"
              )}
            >
              <div className="flex items-center flex-1">
                <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                {route.label}
              </div>
            </Link>
          ))}
        </div>
      </div>
      <div className="px-3 py-2 border-t">
        {/* <Link
          href="/parametres"
          className={cn(
            "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-primary hover:bg-primary/10 rounded-lg transition",
            pathname === "/parametres"
              ? "text-primary bg-primary/10"
              : "text-muted-foreground"
          )}
        >
          {/* <div className="flex items-center flex-1">
            <Settings className="h-5 w-5 mr-3 text-gray-500" />
            Paramètres
          </div>
        </Link> */}
        <Button
          variant="ghost"
          className="w-full justify-start text-sm p-3 font-medium mt-1 cursor-pointer"
          asChild
        >
          <div className="cursor-pointer" onClick={() => signOut()}>
            <LogOut className="h-5 w-5 mr-3 text-gray-500" />
            Déconnexion
          </div>
        </Button>
      </div>
    </div>
  );
}
