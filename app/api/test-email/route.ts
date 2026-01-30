import { sendEmail } from "@/actions/send-email";
import EmailTemplate from "@/lib/emails/template";


export async function GET() {
  await sendEmail({
    to: "vrindavancalicut@gmail.com",
    subject: "Resend Test – Finhance",
    react: EmailTemplate({
      userName: "Test User",
      type: "budget-alert",
      data: {
        alertType: "WARNING",
        percentageUsed: "90",
        budgetAmount: "10000",
        totalExpenses: "9000",
        accountName: "Main Account",
      },
    }),
  });

  return Response.json({ ok: true });
}
