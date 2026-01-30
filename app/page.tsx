"use client";

import { Button } from "@heroui/button";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { title, subtitle } from "@/components/primitives";

export default function Home() {
  const { isSignedIn } = useUser();
  const router = useRouter();

  const handleGetStarted = () => {
    if (isSignedIn) {
      router.push("/dashboard");
    } else {
      router.push("/sign-in");
    }
  };

  return (
    <section className="relative flex flex-col items-center justify-center text-center min-h-[calc(100vh-120px)] px-4 overflow-hidden">
      {/*Background gradient */}
      <div
    className="
    absolute inset-0 -z-10
    bg-gradient-to-b
    from-transparent
    via-sky-500/5
    to-transparent
    dark:via-sky-950/10
    dark:to-black
  "
/>


      {/* Floating blue glow */}
      <div className="absolute bottom-32 w-[400px] h-[400px]
        bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-500
        opacity-30 blur-3xl rounded-full animate-pulse-slow"
      />

      {/* Title */}
      <h1 className={`${title()} text-4xl md:text-6xl font-bold`}>
        The future of finance
        <br />
        <span
          className="
            bg-gradient-to-r from-blue-500 via-cyan-400 to-sky-500
            bg-clip-text text-transparent
            drop-shadow-[0_0_30px_rgba(34,211,238,0.35)]
          "
        >
          Simplified by AI
        </span>
      </h1>

      {/* Subtitle */}
      <p className={`${subtitle({ class: "mt-6 text-base md:text-lg" })}`}>
        The intelligent way to track spending, manage budgets, and build wealth —
        all in one place.
      </p>

      {/* Animated Button */}
      <div className="mt-10 relative group">
        {/* Glowing background behind button */}
        <div
          className="
            absolute inset-0
            bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-500
            blur-xl opacity-60 rounded-full
            animate-gradient-move
            group-hover:scale-110
            transition-transform duration-500
          "
        />

        <Button
          radius="full"
          variant="shadow"
          size="lg"
          className="
            relative z-10 px-10 py-6 text-lg font-semibold text-white
            bg-gradient-to-r from-blue-600 to-cyan-500
            hover:from-blue-500 hover:to-cyan-400
            shadow-lg shadow-cyan-500/40
            transition-all duration-300
            animate-none group-hover:animate-pulse-button
          "
          onPress={handleGetStarted}
        >
          Get Started
        </Button>
      </div>
    </section>
  );
}
