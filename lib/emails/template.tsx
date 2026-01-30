import * as React from "react";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type MonthlyReportData = {
  stats: {
    totalIncome: number;
    totalExpenses: number;
    byCategory: Record<string, number>;
  };
  month: string;
  insights: string[];
};

type BudgetAlertData = {
  alertType: "WARNING" | "EXCEEDED";
  percentageUsed: string;
  budgetAmount: string;
  totalExpenses: string;
  accountName: string;
};

type EmailTemplateProps = {
  userName: string;
  type: "monthly-report" | "budget-alert";
  data: MonthlyReportData | BudgetAlertData;
};

/* ------------------------------------------------------------------ */
/* Email Template                                                       */
/* ------------------------------------------------------------------ */

export default function EmailTemplate({
  userName,
  type,
  data,
}: EmailTemplateProps) {
  return (
    <div
      style={{
        fontFamily: "Inter, Arial, sans-serif",
        backgroundColor: "#f3f4f6",
        padding: "24px",
        color: "#111827",
      }}
    >
      <div
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          backgroundColor: "#ffffff",
          borderRadius: "14px",
          padding: "28px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
        }}
      >
        <Header />

        <p style={{ fontSize: "16px", marginBottom: "16px" }}>
          Hi <strong>{userName}</strong>,
        </p>

        {type === "monthly-report" && (
          <MonthlyReport data={data as MonthlyReportData} />
        )}

        {type === "budget-alert" && (
          <BudgetAlert data={data as BudgetAlertData} />
        )}

        <Footer />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Components                                                           */
/* ------------------------------------------------------------------ */

function Header() {
  return (
    <h1
      style={{
        fontSize: "22px",
        marginBottom: "20px",
        color: "#2563eb",
      }}
    >
      Finhance 💰
    </h1>
  );
}

function MonthlyReport({ data }: { data: MonthlyReportData }) {
  const { stats, month, insights } = data;

  return (
    <>
      <h2 style={{ fontSize: "18px", marginBottom: "8px" }}>
        Your {month} Money Snapshot
      </h2>

      <p style={{ color: "#374151", marginBottom: "12px" }}>
        Here’s a clear summary of how your money moved this month — what came in,
        what went out, and what mattered most.
      </p>

      <ul style={{ paddingLeft: "18px", marginBottom: "16px" }}>
        <li>
          <strong>Total Income:</strong> ₹{stats.totalIncome.toFixed(2)}
        </li>
        <li>
          <strong>Total Expenses:</strong> ₹{stats.totalExpenses.toFixed(2)}
        </li>
      </ul>

      <h3 style={{ marginTop: "16px", fontSize: "16px" }}>
        Key Insights from Finhance
      </h3>

      <ul style={{ paddingLeft: "18px" }}>
        {insights.map((insight, i) => (
          <li key={i} style={{ marginBottom: "6px" }}>
            {insight}
          </li>
        ))}
      </ul>

      <p style={{ marginTop: "16px", color: "#374151" }}>
        Small insights today lead to smarter money decisions tomorrow.
      </p>
    </>
  );
}

function BudgetAlert({ data }: { data: BudgetAlertData }) {
  const {
    alertType,
    percentageUsed,
    budgetAmount,
    totalExpenses,
    accountName,
  } = data;

  const isExceeded = alertType === "EXCEEDED";

  return (
    <>
      <h2
        style={{
          fontSize: "18px",
          color: isExceeded ? "#dc2626" : "#d97706",
        }}
      >
        {isExceeded ? "🚨 Budget Limit Crossed" : "⚠️ Budget Check-in"}
      </h2>

      <p style={{ marginBottom: "12px" }}>
        Your <strong>{accountName}</strong> budget is currently at{" "}
        <strong>{percentageUsed}%</strong>.
      </p>

      <ul style={{ paddingLeft: "18px", marginBottom: "12px" }}>
        <li>
          <strong>Budget Limit:</strong> ₹{budgetAmount}
        </li>
        <li>
          <strong>Total Spent:</strong> ₹{totalExpenses}
        </li>
      </ul>

      <p style={{ color: "#374151" }}>
        {isExceeded
          ? "You’ve gone past your planned budget. Reviewing recent expenses now can help you stay in control next month."
          : "You’re approaching your budget limit. A quick check now can help avoid overspending."}
      </p>
    </>
  );
}

function Footer() {
  return (
    <p
      style={{
        fontSize: "12px",
        color: "#6b7280",
        marginTop: "28px",
      }}
    >
      — The Finhance Team
      <br />
      Smart money. Clear decisions.
    </p>
  );
}
