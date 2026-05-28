"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { signOut, onAuthStateChanged, User } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut } from "lucide-react";

export function AuthButton() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  const handleLogout = () => signOut(auth);

  if (user) {
    return (
      <div className="flex items-center gap-4 glass-panel px-4 py-2 rounded-full border-primary/20 shadow-xl">
        <div className="flex flex-col items-end mr-2 hidden sm:flex">
          <span className="text-xs font-headline font-bold text-primary">{user.displayName}</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Sync Active</span>
        </div>
        <Avatar className="h-8 w-8 ring-2 ring-primary/20">
          <AvatarImage src={user.photoURL || ""} />
          <AvatarFallback className="bg-primary/20 text-primary font-bold">
            {user.displayName?.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <Button variant="ghost" size="icon" onClick={handleLogout} className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return null;
}
