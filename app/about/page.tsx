"use client";

import { Card, CardBody } from "@heroui/card";
import Image from "next/image";
import Link from "next/link";

const technologies = [
  {
    name: "Next.js",
    logo: "https://cdn.worldvectorlogo.com/logos/nextjs-2.svg",
    link: "https://nextjs.org/",
  },
  {
    name: "Tailwind CSS",
    logo: "https://cdn.worldvectorlogo.com/logos/tailwind-css-2.svg",
    link: "https://tailwindcss.com/",
  },
  {
    name: "HeroUI",
    logo: "https://avatars.githubusercontent.com/u/80152064?s=200&v=4",
    link: "https://www.heroui.com/",
  },
  {
    name: "Prisma",
    logo: "https://cdn.worldvectorlogo.com/logos/prisma-3.svg",
    link: "https://www.prisma.io/",
  },
  {
    name: "Clerk Auth",
    logo: "https://avatars.githubusercontent.com/u/74152805?s=200&v=4",
    link: "https://clerk.com/",
  },
  {
    name: "Supabase",
    logo: "https://cdn.worldvectorlogo.com/logos/supabase-1.svg",
    link: "https://supabase.com/",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 py-16 bg-gradient-to-b from-background to-background/70 relative overflow-hidden">
      
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-500/10 via-transparent to-cyan-500/10 blur-3xl" />

      <h1 className="text-4xl md:text-5xl font-bold mb-8">
        About <span className="text-cyan-500">Finhance</span>
      </h1>

      <div className="max-w-3xl">
        <p className="text-lg font-medium">
          Finhance is your personal finance companion — built to help individuals and teams track, plan, and optimize their financial goals with clarity and control.
        </p>

        <p className="text-lg font-medium mt-6">
          Our vision is simple: empower smarter money management through an intuitive, modern, and secure experience.
        </p>
      </div>

      <h2 className="text-2xl font-semibold mt-16 mb-6">Our Tech Stack</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl">
        {technologies.map((tech) => (
          <Link
            key={tech.name}
            href={tech.link}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:scale-105 transition-transform"
          >
            <Card className="bg-background/70 border border-border hover:shadow-md backdrop-blur-sm">
              <CardBody className="flex flex-col items-center justify-center py-6 space-y-4">
                <Image
                  src={tech.logo}
                  alt={tech.name}
                  width={50}
                  height={50}
                  className="object-contain"
                />
                <p className="text-sm font-medium">{tech.name}</p>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>

      <p className="text-sm text-muted-foreground mt-16">
        Built using modern web technologies.
      </p>
    </div>
  );
}
