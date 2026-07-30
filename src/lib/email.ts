/**
 * Email sending abstraction.
 *
 * Uses Resend if RESEND_API_KEY is set.
 * Falls back to console.log in local dev — plug in the key when deploying.
 *
 * Install Resend: npm install resend
 */

const FROM_EMAIL = process.env.EMAIL_FROM ?? "CareerForge <noreply@careerforge.app>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export interface FollowUpReminderData {
  to: string;
  userName: string;
  jobTitle: string;
  company: string;
  appliedAt: Date;
  applicationId: string;
  jobId: string;
}

export async function sendFollowUpReminder(data: FollowUpReminderData): Promise<void> {
  const daysSince = Math.floor(
    (Date.now() - data.appliedAt.getTime()) / (1000 * 60 * 60 * 24)
  );
  const subject = `Follow-up reminder: ${data.jobTitle} at ${data.company}`;
  const body = `Hi ${data.userName},

You applied to ${data.jobTitle} at ${data.company} ${daysSince} days ago and haven't logged a response yet.

This is your follow-up reminder — reaching out to the recruiter now can significantly improve your chances.

View your application:
${APP_URL}/jobs/${data.jobId}

Keep tracking, keep improving.

— CareerForge`;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // Dev stub — log to console
    console.log(`[email/stub] Follow-up reminder for ${data.to}:`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Body preview: ${body.slice(0, 100)}…`);
    return;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [data.to],
        subject,
        text: body,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("[email] Resend error:", err);
    }
  } catch (err) {
    console.error("[email] Failed to send:", err);
  }
}
