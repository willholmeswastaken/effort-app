"use client";

import { useState } from "react";
import { useSession, signOut } from "@/lib/auth-client";
import { LogOut, Shield } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export function UserMenu() {
  const { data: session, isPending } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);

  // Check admin status when dropdown opens
  const handleOpenChange = async (open: boolean) => {
    if (open && session?.user) {
      try {
        const res = await fetch("/api/admin/me");
        if (res.ok) {
          const data = await res.json();
          setIsAdmin(data.isAdmin);
        }
      } catch {
        // Not admin or error - silently ignore
      }
    }
  };

  // Prevent hydration mismatch - show skeleton while loading
  if (isPending || !session?.user) {
    return (
      <div className="w-9 h-9 rounded-full bg-[#1C1C1E] animate-pulse" />
    );
  }

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <button className="w-9 h-9 rounded-full bg-white/20 overflow-hidden outline-none">
          {session.user.image ? (
            <img
              src={session.user.image}
              alt={session.user.name ?? "User"}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm font-medium">
              {session.user.name?.charAt(0) ?? "U"}
            </div>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="bg-[#1C1C1E] border-white/5 text-white rounded-xl min-w-[180px]"
      >
        <div className="px-3 py-2 border-b border-white/5">
          <p className="text-sm font-medium">{session.user.name}</p>
          <p className="text-xs text-[#8E8E93]">{session.user.email}</p>
        </div>
        {isAdmin && (
          <>
            <DropdownMenuItem asChild className="focus:bg-white/5 focus:text-white py-2.5 cursor-pointer">
              <Link href="/admin">
                <Shield className="w-4 h-4 mr-2 text-[#0078FF]" />
                Admin Panel
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/5" />
          </>
        )}
        <DropdownMenuItem
          onClick={handleSignOut}
          className="focus:bg-white/5 focus:text-white py-2.5 cursor-pointer text-red-400"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
