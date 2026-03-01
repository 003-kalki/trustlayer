"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const NavLink = forwardRef(
  (
    {
      href,
      className,
      activeClassName,
      exact = false,
      ...props
    },
    ref
  ) => {
    const pathname = usePathname();

    const isActive = exact
      ? pathname === href
      : pathname.startsWith(href);

    return (
      <Link
        ref={ref}
        href={href}
        className={cn(className, isActive && activeClassName)}
        {...props}
      />
    );
  }
);

NavLink.displayName = "NavLink";

export { NavLink };