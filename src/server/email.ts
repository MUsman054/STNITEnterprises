import "server-only";
import { addressLines } from "@/lib/order";
import { formatPrice, site } from "@/lib/site";
import { appUrl, config, isProduction } from "@/server/env";
import { escapeHtml as e, singleLine } from "@/server/security";
import type { Inquiry, Order, OrderItem } from "@/server/db/schema";

/**
 * Transactional email through Resend's HTTP API (https://resend.com).
 * Sending never throws: a failed email is logged, and the record it belongs to is already
 * safe in the database, so the customer's action still succeeds.
 */

type Mail = { to: string; subject: string; html: string; text: string; replyTo?: string };

export async function sendEmail(mail: Mail): Promise<boolean> {
  if (!config.emailEnabled()) {
    if (!isProduction) console.info(`[email skipped: RESEND_API_KEY/EMAIL_FROM not set] to=${mail.to} subject=${mail.subject}`);
    else console.error("[email] RESEND_API_KEY or EMAIL_FROM is not set; email not sent:", mail.subject);
    return false;
  }
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: [mail.to],
        subject: singleLine(mail.subject),
        html: mail.html,
        text: mail.text,
        ...(mail.replyTo ? { reply_to: singleLine(mail.replyTo) } : {}),
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      console.error("[email] Resend rejected the message:", response.status, await response.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error("[email] send failed:", error);
    return false;
  }
}

// ---------- layout ----------

function layout(title: string, body: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif;color:#121417">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px">
<tr><td style="padding:24px 28px;border-bottom:1px solid #e5e7eb"><strong style="font-size:18px">${e(site.name)}</strong></td></tr>
<tr><td style="padding:28px"><h1 style="margin:0 0 16px;font-size:22px">${e(title)}</h1>${body}</td></tr>
<tr><td style="padding:20px 28px;border-top:1px solid #e5e7eb;font-size:13px;color:#6b7280">
${e(site.legalName)} · ${e(site.contact.phone)} · ${e(site.contact.salesEmail)}</td></tr>
</table></td></tr></table></body></html>`;
}

const p = (html: string) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.5">${html}</p>`;

function itemsTable(items: OrderItem[], order: Order): string {
  const rows = items
    .map(
      (item) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #eee">${e(item.productName)}<br><span style="color:#6b7280;font-size:13px">${e(item.mpn)} × ${item.quantity}</span></td>
<td align="right" style="padding:8px 0;border-bottom:1px solid #eee;white-space:nowrap">${e(formatPrice(item.lineTotalCents / 100))}</td></tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:15px;margin:8px 0 18px">${rows}
<tr><td style="padding:8px 0">Shipping</td><td align="right">${order.shippingCents === 0 ? "Free" : e(formatPrice(order.shippingCents / 100))}</td></tr>
<tr><td style="padding:8px 0"><strong>Total</strong></td><td align="right"><strong>${e(formatPrice(order.totalCents / 100))}</strong></td></tr></table>`;
}

function addressBlock(order: Order): string {
  return [`${order.firstName} ${order.lastName}`, ...addressLines(order)]
    .map((line) => e(line))
    .join("<br>");
}

function itemsText(items: OrderItem[], order: Order): string {
  return [
    ...items.map((item) => `- ${item.productName} (${item.mpn}) x ${item.quantity}: ${formatPrice(item.lineTotalCents / 100)}`),
    `Total: ${formatPrice(order.totalCents / 100)}`,
  ].join("\n");
}

// ---------- order emails ----------

export async function sendOrderEmails(order: Order, items: OrderItem[], accessUrl: string | null) {
  const bank = order.status === "awaiting_bank_transfer";
  const bankInstructions = config.bankTransferInstructions();

  const customerIntro = bank
    ? `Thanks for your order. Please pay by bank transfer using the details below and include your order number <strong>${e(order.number)}</strong> as the payment reference. We'll ship as soon as the payment arrives.`
    : `Thanks for your order. Your payment was received and we're getting your items ready.`;

  const customerHtml = layout(
    `Order ${order.number} ${bank ? "received" : "confirmed"}`,
    p(`Hi ${e(order.firstName)},`) +
      p(customerIntro) +
      (bank && bankInstructions
        ? `<pre style="white-space:pre-wrap;background:#f4f5f7;border-radius:8px;padding:14px;font-size:14px">${e(bankInstructions)}</pre>`
        : "") +
      itemsTable(items, order) +
      p(`<strong>Shipping to</strong><br>${addressBlock(order)}`) +
      (accessUrl ? p(`<a href="${e(accessUrl)}">View your order</a>`) : "") +
      p(`Questions? Reply to this email or call ${e(site.contact.phone)}.`),
  );

  await sendEmail({
    to: order.email,
    replyTo: site.contact.salesEmail,
    subject: `Your ${site.name} order ${order.number}`,
    html: customerHtml,
    text: `Hi ${order.firstName},\n\n${bank ? `Please pay by bank transfer using reference ${order.number}.\n\n${bankInstructions ?? ""}` : "Your payment was received."}\n\n${itemsText(items, order)}\n\n${accessUrl ?? ""}`,
  });

  const adminUrl = `${appUrl()}/admin/orders/${order.id}`;
  await sendEmail({
    to: config.notifyEmail(),
    replyTo: order.email,
    subject: `New order ${order.number} · ${formatPrice(order.totalCents / 100)} · ${bank ? "awaiting bank transfer" : "PAID"}`,
    html: layout(
      `New order ${order.number}`,
      p(`<strong>Status:</strong> ${bank ? "Awaiting bank transfer" : "Paid by card"}`) +
        p(`<strong>Customer:</strong> ${e(order.firstName)} ${e(order.lastName)} · ${e(order.email)} · ${e(order.phone)}`) +
        itemsTable(items, order) +
        p(`<strong>Ship to</strong><br>${addressBlock(order)}`) +
        (order.notes ? p(`<strong>Notes:</strong> ${e(order.notes)}`) : "") +
        p(`<a href="${e(adminUrl)}">Open in admin</a>`),
    ),
    text: `New order ${order.number}\n${order.firstName} ${order.lastName} <${order.email}> ${order.phone}\n\n${itemsText(items, order)}\n\n${adminUrl}`,
  });
}

export async function sendShippedEmail(order: Order) {
  const tracking = order.trackingNumber ? `${order.carrier ? `${order.carrier}: ` : ""}${order.trackingNumber}` : null;
  await sendEmail({
    to: order.email,
    replyTo: site.contact.salesEmail,
    subject: `Your order ${order.number} has shipped`,
    html: layout(
      `Order ${order.number} shipped`,
      p(`Hi ${e(order.firstName)},`) +
        p("Good news: your order is on its way.") +
        (tracking ? p(`<strong>Tracking:</strong> ${e(tracking)}`) : "") +
        p(`Questions? Reply to this email or call ${e(site.contact.phone)}.`),
    ),
    text: `Hi ${order.firstName},\n\nYour order ${order.number} has shipped.${tracking ? `\nTracking: ${tracking}` : ""}`,
  });
}

// ---------- inquiries ----------

const inquiryLabel: Record<Inquiry["kind"], string> = {
  contact: "Contact message",
  quote: "Quote request",
  part: "Part request",
};

export async function sendInquiryNotification(inquiry: Inquiry) {
  const label = inquiryLabel[inquiry.kind];
  const rows: [string, string | null][] = [
    ["Name", inquiry.name],
    [inquiry.email.includes("@") ? "Email" : "Phone", inquiry.email],
    ["Part number", inquiry.partNumber],
    ["Quantity", inquiry.quantity?.toString() ?? null],
    ["Target price (each)", inquiry.targetPriceCents != null ? formatPrice(inquiry.targetPriceCents / 100) : null],
  ];
  const present = rows.filter((row): row is [string, string] => Boolean(row[1]));

  await sendEmail({
    to: config.notifyEmail(),
    ...(inquiry.email.includes("@") ? { replyTo: inquiry.email } : {}),
    subject: `${label} from ${inquiry.name}${inquiry.partNumber ? ` · ${inquiry.partNumber}` : ""}`,
    html: layout(
      label,
      present.map(([k, v]) => p(`<strong>${e(k)}:</strong> ${e(v)}`)).join("") +
        (inquiry.message ? `<div style="white-space:pre-wrap;background:#f4f5f7;border-radius:8px;padding:14px;font-size:15px">${e(inquiry.message)}</div>` : "") +
        p(inquiry.email.includes("@") ? `<br>Reply to this email to answer ${e(inquiry.name)} directly.` : `<br>Call or text ${e(inquiry.name)} on the number above.`),
    ),
    text: `${label}\n\n${present.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\n${inquiry.message ?? ""}`,
  });
}

// ---------- accounts ----------

export async function sendPasswordResetEmail(to: string, name: string, resetUrl: string) {
  await sendEmail({
    to,
    subject: `Reset your ${site.name} password`,
    html: layout(
      "Reset your password",
      p(`Hi ${e(name)},`) +
        p("We received a request to reset your password. This link works once and expires in 1 hour.") +
        p(`<a href="${e(resetUrl)}" style="display:inline-block;background:#121417;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none">Choose a new password</a>`) +
        p("If you didn't ask for this, you can ignore this email. Your password won't change."),
    ),
    text: `Hi ${name},\n\nReset your password (link expires in 1 hour):\n${resetUrl}\n\nIf you didn't ask for this, ignore this email.`,
  });
}

// ---------- store admin team ----------

export async function sendStaffInviteEmail(invite: { to: string; inviterName: string; roleLabel: string; acceptUrl: string; expiresHours: number }): Promise<boolean> {
  const { to, inviterName, roleLabel, acceptUrl, expiresHours } = invite;
  return sendEmail({
    to,
    subject: `${inviterName} invited you to the ${site.name} store admin`,
    html: layout(
      "You're invited to the store admin",
      p(`${e(inviterName)} invited you to join the ${e(site.name)} team as <strong>${e(roleLabel)}</strong>.`) +
        p(`<a href="${e(acceptUrl)}" style="display:inline-block;background:#121417;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none">Accept invitation</a>`) +
        p(`This link works once and expires in ${expiresHours} hours. If you weren't expecting this, you can ignore this email.`),
    ),
    text: `${inviterName} invited you to join the ${site.name} team as ${roleLabel}.\n\nAccept the invitation (link expires in ${expiresHours} hours):\n${acceptUrl}\n\nIf you weren't expecting this, ignore this email.`,
  });
}
