import "server-only";
import nodemailer from "nodemailer";
import { q } from "./db";

async function settings() {
  const rows = await q<{ key: string; value: string }>("SELECT key, value FROM settings WHERE key LIKE 'smtp_%' OR key LIKE 'mail_%' OR key = 'site_name'");
  const s: Record<string, string> = {};
  for (const r of rows) s[r.key] = r.value;
  return s;
}

export function mailConfigured(s: Record<string, string>) {
  return !!(s.smtp_host && s.smtp_user && s.smtp_pass);
}

const esc = (v: string) => v.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Marka renginde basit, e-posta istemcileriyle uyumlu HTML şablonu. */
export function mailLayout(siteName: string, title: string, bodyHtml: string) {
  return `<!doctype html><html><body style="margin:0;background:#0A090C;font-family:Arial,Helvetica,sans-serif;color:#F5EFE8">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0A090C;padding:32px 12px"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#1A1720;border:1px solid #2E2836;border-radius:18px;overflow:hidden">
<tr><td style="padding:22px 28px;background:linear-gradient(135deg,#FFB224,#FF6A13);color:#0A090C;font-size:22px;font-weight:800">${esc(siteName)}</td></tr>
<tr><td style="padding:28px">
<h1 style="margin:0 0 14px;font-size:20px;color:#F5EFE8">${esc(title)}</h1>
${bodyHtml}
</td></tr>
<tr><td style="padding:16px 28px;border-top:1px solid #2E2836;color:#A096A8;font-size:12px">Bu e-posta ${esc(siteName)} tarafından otomatik gönderildi.</td></tr>
</table></td></tr></table></body></html>`;
}

export function codesHtml(lines: { title: string; codes: string[] }[]) {
  return lines
    .map(
      (l) => `<p style="margin:18px 0 8px;font-weight:700;color:#FFB224">${esc(l.title)}</p>` +
        l.codes
          .map((c) => `<div style="margin:6px 0;padding:12px 14px;border:1px dashed #FF6A13;border-radius:10px;background:#221a14;font-family:'Courier New',monospace;font-size:16px;font-weight:700;letter-spacing:1px;color:#F5EFE8">${esc(c)}</div>`)
          .join(""),
    )
    .join("");
}

export async function sendMail(to: string, subject: string, title: string, bodyHtml: string, text: string) {
  const s = await settings();
  if (!mailConfigured(s)) throw new Error("E-posta (SMTP) ayarları girilmemiş.");
  const port = Number(s.smtp_port) || 587;
  const transport = nodemailer.createTransport({
    host: s.smtp_host,
    port,
    secure: s.smtp_secure === "on" || port === 465,
    auth: { user: s.smtp_user, pass: s.smtp_pass },
    connectionTimeout: 10000,
  });
  const site = s.site_name || "EpicPin";
  await transport.sendMail({
    from: { name: s.mail_from_name || site, address: s.mail_from_email || s.smtp_user },
    to,
    subject,
    text,
    html: mailLayout(site, title, bodyHtml),
  });
}

/** Teslim edilen kodları e-postayla gönderir; SMTP yoksa sessizce false döner. */
export async function mailCodes(to: string, ref: string, lines: { title: string; codes: string[] }[], intro?: string) {
  const s = await settings();
  if (!mailConfigured(s) || !to) return false;
  const site = s.site_name || "EpicPin";
  const text = `${intro ?? "Siparişin teslim edildi."}\n\n` + lines.map((l) => `${l.title}\n${l.codes.join("\n")}`).join("\n\n");
  await sendMail(
    to,
    `${site} siparişin teslim edildi (${ref})`,
    "Siparişin teslim edildi",
    `<p style="margin:0;color:#d9d1dc;line-height:1.6">${esc(intro ?? "Ödemen onaylandı. Kodların aşağıda, kopyalayıp hemen kullanabilirsin.")}</p>${codesHtml(lines)}
     <p style="margin:22px 0 0;color:#A096A8;font-size:13px">Sipariş: ${esc(ref)}. Kodlarını kimseyle paylaşma.</p>`,
    text,
  );
  return true;
}
