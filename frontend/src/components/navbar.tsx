"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import React, { useState } from "react";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  Mail,
  Home,
  Info,
  LogOut,
  Menu,
  UserRound,
  X,
} from "lucide-react";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { ModeToggle } from "./mode-toggle";
import { useAppData } from "@/context/AppContext";

const navigation = [
  { href: "/", label: "Home", icon: Home },
  { href: "/jobs", label: "Find a job", icon: BriefcaseBusiness },
  { href: "/about", label: "About", icon: Info },
  { href: "/contact", label: "Contact", icon: Mail },
];

const NavBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { isAuth, user, loading, logoutUser } = useAppData();

  const closeMenu = () => setIsOpen(false);

  return (
    <header className="site-header">
      <nav className="site-nav" aria-label="Main navigation">
        <Link href="/" className="site-brand" aria-label="HireHeaven home" onClick={closeMenu}>
          <Image className="site-brand-mark" src="/hireheaven-logo.svg" width={40} height={40} alt="" priority />
          <span className="site-brand-wordmark"><span className="site-brand-hire">Hire</span><span className="site-brand-heaven">Heaven</span></span>
        </Link>

        <div className="site-nav-links">
          {navigation.map(({ href, label }) => {
            const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                href={href}
                key={href}
                className={`site-nav-link${isActive ? " is-active" : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                {label}
              </Link>
            );
          })}
        </div>

        <div className="site-nav-actions">
          <ModeToggle />
          {!loading && (isAuth ? (
            <>
              {user?.role === "recruiter" && (
                <Link href="/account" className="nav-hiring-link-wrapper">
                  <Button variant="outline" className="nav-hiring-link">
                    <Building2 size={16} /> Hiring dashboard
                  </Button>
                </Link>
              )}
              <Popover>
                <PopoverTrigger asChild>
                  <button className="site-avatar-button" aria-label="Open account menu">
                    <Avatar className="site-avatar">
                      <AvatarImage src={user?.profile_pic || ""} alt={user?.name || ""} />
                      <AvatarFallback>{user?.name?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                    </Avatar>
                    <span className="site-avatar-name">{user?.name?.split(" ")[0]}</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-60 p-2" align="end">
                  <div className="px-3 py-3 mb-1 border-b">
                    <p className="font-semibold truncate">{user?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                  <Link href="/account">
                    <Button className="w-full justify-start gap-2" variant="ghost">
                      <UserRound size={16} /> My profile
                    </Button>
                  </Link>
                  <Button
                    className="w-full justify-start gap-2 text-destructive"
                    variant="ghost"
                    onClick={logoutUser}
                  >
                    <LogOut size={16} /> Sign out
                  </Button>
                </PopoverContent>
              </Popover>
            </>
          ) : (
            <>
              <Link href="/login" className="nav-sign-in">Sign in</Link>
              <Link href="/register" className="nav-join-link">
                <Button className="nav-join-button">Create account <ArrowUpRight size={16} /></Button>
              </Link>
            </>
          ))}
          <button
            className="mobile-menu-button"
            onClick={() => setIsOpen((open) => !open)}
            aria-label={isOpen ? "Close menu" : "Open menu"}
            aria-expanded={isOpen}
          >
            {isOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </nav>

      {isOpen && (
        <div className="mobile-nav-panel">
          {navigation.map(({ href, label, icon: Icon }) => (
            <Link href={href} key={href} onClick={closeMenu}>
              <Icon size={18} /> {label}
            </Link>
          ))}
          {isAuth ? (
            <>
              <Link href="/account" onClick={closeMenu}><UserRound size={18} /> My profile</Link>
              {user?.role === "recruiter" && (
                <Link href="/account" onClick={closeMenu}><Building2 size={18} /> Hiring dashboard</Link>
              )}
              <button onClick={() => { logoutUser(); closeMenu(); }}><LogOut size={18} /> Sign out</button>
            </>
          ) : !loading && (
            <Link href="/login" onClick={closeMenu}><UserRound size={18} /> Sign in</Link>
          )}
        </div>
      )}
    </header>
  );
};

export default NavBar;
