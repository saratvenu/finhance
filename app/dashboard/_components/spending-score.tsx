"use client";

import { useEffect, useState } from "react";

type Props = {
  userId: string;
  accountId: string;
};

export default function SpendingScoreCard({
  userId,
  accountId,
}: Props) {
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    if (!accountId) return;

    fetch(
      `/api/spending-score?userId=${userId}&accountId=${accountId}`
    )
      .then((res) => res.json())
      .then((data) => setScore(data.score));
  }, [userId, accountId]);

  if (!accountId) {
    return (
      <div className="rounded-xl border p-4 text-sm text-muted-foreground">
        Select a default account to see your spending score
      </div>
    );
  }

  /* ------------------------------------------------------------ */
  /* UI helpers                                                   */
  /* ------------------------------------------------------------ */

  const radius = 42;
  const circumference = 2 * Math.PI * radius;

  const progress =
    score !== null
      ? circumference - (score / 100) * circumference
      : circumference;

  const isHigh = score !== null && score >= 85;
  const isMedium =
    score !== null && score >= 65 && score < 85;
  const isLow = score !== null && score < 65;

  const ringColor = isHigh
    ? "#22C55E"
    : isMedium
    ? "#F59E0B"
    : "#EF4444";

  const glowClass = isHigh
    ? "shadow-[0_0_30px_rgba(34,197,94,0.25)]"
    : isMedium
    ? "shadow-[0_0_30px_rgba(245,158,11,0.25)]"
    : isLow
    ? "shadow-[0_0_30px_rgba(239,68,68,0.25)]"
    : "";

  const status =
    score === null
      ? "Calculating…"
      : score === 100
      ? "Perfect month 🎉"
      : isHigh
      ? "Excellent control"
      : isMedium
      ? "Needs attention"
      : "High risk";

  const insight =
    score === null
      ? ""
      : score === 100
      ? "Perfect discipline this month — keep doing exactly what you’re doing."
      : isHigh
      ? "You’re doing well overall. Try reducing small recurring expenses to push for a perfect score."
      : isMedium
      ? "Spending is trending high. Review discretionary expenses and track spending more frequently."
      : "Spending exceeded safe limits. Focus on staying within budget and improving savings next month.";

  /* ------------------------------------------------------------ */
  /* Render                                                       */
  /* ------------------------------------------------------------ */

  return (
    <div
      className={`rounded-xl border p-6 flex flex-col gap-5 transition-shadow
        bg-white text-gray-900
        dark:bg-black dark:text-white
        ${glowClass}`}
    >
      <h3 className="text-sm font-medium bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
        Monthly Spending Score
      </h3>

      <div className="flex items-center gap-6">
        {/* Meter */}
        <svg width="110" height="110">
          {/* Background ring */}
          <circle
            cx="55"
            cy="55"
            r={radius}
            stroke="#E5E7EB"
            strokeWidth="10"
            fill="none"
            className="dark:stroke-gray-700"
          />

          {/* Progress ring */}
          <circle
            cx="55"
            cy="55"
            r={radius}
            stroke={ringColor}
            strokeWidth="10"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={progress}
            strokeLinecap="round"
            transform="rotate(-90 55 55)"
            style={{
              transition:
                "stroke-dashoffset 0.6s ease, stroke 0.3s ease",
            }}
          />

          {/* Score number */}
          <text
            x="55"
            y="62"
            textAnchor="middle"
            className="
              text-2xl font-bold
              fill-gray-900
              dark:fill-white
            "
            style={{
              filter:
                "drop-shadow(0 0 4px rgba(0,0,0,0.15))",
            }}
          >
            {score ?? "--"}
          </text>
        </svg>

        {/* Text */}
        <div className="flex flex-col gap-1 min-w-0">
          <span className="font-medium">
            {status}
          </span>

          {/* Insight */}
          <p className="text-sm text-gray-600 dark:text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">
            {insight}
          </p>
        </div>
      </div>
    </div>
  );
}
