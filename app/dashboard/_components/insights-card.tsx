import type { Insight } from "@/actions/insights";

const severityStyles = {
  positive:
    "from-emerald-500 via-teal-500 to-cyan-500",
  warning:
    "from-amber-500 via-orange-500 to-yellow-500",
  danger:
    "from-rose-500 via-red-500 to-pink-500",
};

const severityEmoji = {
  positive: "🟢",
  warning: "🟡",
  danger: "🔴",
};

export function InsightsCard({
  insights,
}: {
  insights: Insight[];
}) {
  if (!insights || insights.length === 0) {
    return (
      <div className="rounded-xl border p-4">
        <h3 className="font-semibold">Insights</h3>
        <p className="text-sm text-muted-foreground">
          Add more transactions to unlock insights.
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <h3 className="text-lg font-semibold">
        Your Financial Insights
      </h3>

      <div className="grid gap-4 md:grid-cols-2">
        {insights.map((insight, index) => (
          <div
            key={index}
            className={`
              rounded-xl p-5 text-white
              bg-gradient-to-br
              ${severityStyles[insight.severity]}
            `}
          >
            <h4 className="font-semibold flex items-center gap-2">
              <span>{severityEmoji[insight.severity]}</span>
              {insight.title}
            </h4>

            <p className="text-sm opacity-90 mt-2 leading-relaxed">
              {insight.message}
            </p>

            {insight.recommendation && (
              <p className="text-xs opacity-85 mt-4">
                👉 {insight.recommendation}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
