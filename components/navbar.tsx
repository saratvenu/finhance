"use client";

import {
  Navbar as HeroUINavbar,
  NavbarContent,
  NavbarMenu,
  NavbarMenuToggle,
  NavbarBrand,
  NavbarItem,
  NavbarMenuItem,
} from "@heroui/navbar";
import { Button } from "@heroui/button";
import { Kbd } from "@heroui/kbd";
import { Link } from "@heroui/link";
import { Input } from "@heroui/input";
import { link as linkStyles } from "@heroui/theme";

import NextLink from "next/link";
import clsx from "clsx";

import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import { SearchIcon } from "@/components/icons";
import { FinhanceLogo } from "@/components/icons/finhance-logo";

import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";

export const Navbar = () => {
  const searchInput = (
    <Input
      aria-label="Search"
      classNames={{
        inputWrapper: "bg-default-100",
        input: "text-sm",
      }}
      endContent={
        <Kbd className="hidden lg:inline-block" keys={["command"]}>
          K
        </Kbd>
      }
      labelPlacement="outside"
      placeholder="Search..."
      startContent={
        <SearchIcon className="pointer-events-none flex-shrink-0 text-base text-default-400" />
      }
      type="search"
    />
  );

  const filteredNavItems = siteConfig.navItems.filter(
    (item) => item.label.toLowerCase() !== "blog"
  );

  return (
    <HeroUINavbar maxWidth="xl" position="sticky">
      {/* LEFT */}
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand as="li" className="max-w-fit">
          {/* LOGO TO DASHBOARD */}
          <NextLink
            href="/dashboard"
            aria-label="Go to Dashboard"
            className="group flex items-center gap-2"
          >
            <FinhanceLogo
              className="
                h-8 w-8
                transition-transform duration-200
                group-hover:scale-105
              "
            />

            <p className="font-bold tracking-wide text-inherit">
              FINHANCE
            </p>
          </NextLink>
        </NavbarBrand>

        <ul className="ml-2 hidden gap-4 lg:flex">
          {filteredNavItems.map((item) => (
            <NavbarItem key={item.href}>
              <NextLink
                href={item.href}
                className={clsx(
                  linkStyles({ color: "foreground" }),
                  "data-[active=true]:font-medium data-[active=true]:text-primary"
                )}
              >
                {item.label}
              </NextLink>
            </NavbarItem>
          ))}
        </ul>
      </NavbarContent>

      {/* RIGHT */}
      <NavbarContent
        className="hidden basis-1/5 sm:basis-full sm:flex"
        justify="end"
      >
        <NavbarItem className="hidden sm:flex">
          <ThemeSwitch />
        </NavbarItem>

        <NavbarItem className="hidden lg:flex">{searchInput}</NavbarItem>

        <NavbarItem className="hidden md:flex gap-2">
          <SignedOut>
            <SignInButton>
              <Button as="button" variant="flat">
                Sign In
              </Button>
            </SignInButton>

            <SignUpButton>
              <Button as="button" color="primary" variant="solid">
                Sign Up
              </Button>
            </SignUpButton>
          </SignedOut>

          <SignedIn>
            <UserButton />
          </SignedIn>
        </NavbarItem>
      </NavbarContent>

      {/* MOBILE */}
      <NavbarContent className="basis-1 pl-4 sm:hidden" justify="end">
        <ThemeSwitch />
        <NavbarMenuToggle />
      </NavbarContent>

      <NavbarMenu>
        {searchInput}

        <div className="mx-4 mt-2 flex flex-col gap-2">
          {filteredNavItems.map((item, index) => (
            <NavbarMenuItem key={`${item.href}-${index}`}>
              <Link color="foreground" href={item.href} size="lg">
                {item.label}
              </Link>
            </NavbarMenuItem>
          ))}
        </div>
      </NavbarMenu>
    </HeroUINavbar>
  );
};
