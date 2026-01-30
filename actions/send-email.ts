"use server";

import { Resend } from "resend";
import { render } from "@react-email/render";
import React from "react";

const resend = new Resend(process.env.RESEND_API_KEY);

type SendEmailArgs = {
  to: string;
  subject: string;
  react: React.ReactElement;
};

export async function sendEmail({
  to,
  subject,
  react,
}: SendEmailArgs) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not set");
  }

  if (!process.env.RESEND_FROM) {
    throw new Error("RESEND_FROM is not set");
  }

  if (!to) {
    throw new Error("Recipient email is missing");
  }

  const html = await render(react);

  const result = await resend.emails.send({
    from: process.env.RESEND_FROM,
    to,
    subject,
    html,
  });

  if (result.error) {
    console.error("Resend email failed", {
      to,
      from: process.env.RESEND_FROM,
      subject,
      error: result.error,
    });

    throw new Error(
      `Email delivery failed: ${result.error.message}`
    );
  }

  console.log("Email sent successfully", {
    to,
    subject,
    messageId: result.data?.id,
  });
}
