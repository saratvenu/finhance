export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Finhance",
  description: "A modern finance management platform.",
  navItems: [
    { label: "Home", href: "/" },
    { label: "Dashboard", href: "/dashboard" },
    { label: "Pricing", href: "/pricing" },
    { label: "About", href: "/about" },
  ],
  navMenuItems: [
    { label: "Profile", href: "/profile" },
    { label: "Dashboard", href: "/dashboard" },
    { label: "Settings", href: "/settings" },
    { label: "Help & Feedback", href: "/help-feedback" },
    { label: "Logout", href: "/logout" },
  ],
  links: {
    dashboard: "https://heroui.com",
  },
};
