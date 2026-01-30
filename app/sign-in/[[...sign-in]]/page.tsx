"use client";

import { SignIn } from "@clerk/nextjs";
import { useTheme } from "next-themes";

export default function SignInPage() {
  const { theme } = useTheme();

  const isDark = theme === "dark";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="relative z-10 backdrop-blur-md bg-card border border-border rounded-2xl shadow-lg p-8">
        <SignIn
          path="/sign-in"
          routing="path"
          signUpUrl="/sign-up"
          appearance={{
            layout: {
              socialButtonsPlacement: "bottom",
              socialButtonsVariant: "blockButton",
            },
            elements: {
              // Core button styling
              formButtonPrimary:
                "bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-md py-2 transition",

              // Card background adapts to theme
              card: isDark
                ? "shadow-xl border border-border rounded-2xl bg-neutral-900/80 backdrop-blur-lg"
                : "shadow-xl border border-border rounded-2xl bg-white/90 backdrop-blur-lg",

              // Text & labels
              headerTitle: "text-foreground text-2xl font-bold",
              headerSubtitle: "text-muted-foreground",
              formFieldLabel: "text-muted-foreground",

              // Input fields
              formFieldInput:
                "bg-background text-foreground border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500",

              // Footer link
              footerActionLink: "text-violet-500 hover:text-violet-400 font-medium",
            },
            variables: {
              colorPrimary: "#622ddfff",
              colorBackground: isDark ? "#0a0a0a" : "#ffffff",
              colorInputBackground: isDark ? "#111111" : "#f9f9f9",
              colorText: isDark ? "#fafafa" : "#111111",
            },
          }}
          forceRedirectUrl="/dashboard"
        />
      </div>
    </div>
  );
}
