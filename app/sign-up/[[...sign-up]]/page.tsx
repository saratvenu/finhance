"use client";

import { SignUp } from "@clerk/nextjs";
import { useTheme } from "next-themes";

export default function SignUpPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="relative z-10 backdrop-blur-md bg-card border border-border rounded-2xl shadow-lg p-8">
        <SignUp
          path="/sign-up"
          routing="path"
          signInUrl="/sign-in"
          appearance={{
            layout: {
              socialButtonsPlacement: "bottom",
              socialButtonsVariant: "blockButton",
            },
            elements: {
              formButtonPrimary:
                "bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-md py-2 transition",
              card: isDark
                ? "shadow-xl border border-border rounded-2xl bg-neutral-900/80 backdrop-blur-lg"
                : "shadow-xl border border-border rounded-2xl bg-white/90 backdrop-blur-lg",
              headerTitle: "text-foreground text-2xl font-bold",
              headerSubtitle: "text-muted-foreground",
              formFieldLabel: "text-muted-foreground",
              formFieldInput:
                "bg-background text-foreground border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500",
              footerActionLink: "text-violet-500 hover:text-violet-400 font-medium",
            },
            variables: {
              colorPrimary: "#8b5cf6",
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
