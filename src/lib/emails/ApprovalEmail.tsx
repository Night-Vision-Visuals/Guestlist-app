/**
 * @file src/lib/emails/ApprovalEmail.tsx
 *
 * HTML email template for approved guests.
 * Returns a plain HTML string (no React Email dependency needed).
 * The QR code is embedded as a base64 inline image AND a ticket link is included.
 */

export interface ApprovalEmailData {
  guestName: string
  eventName: string
  eventDate: string
  ticketUrl: string
  qrCodeDataUrl: string // base64 data URL from qrcode library
  entryPrice: number
  plusOneCode?: string  // auto-generated +1 invite code for eligible crew members
}

export function renderApprovalEmail(data: ApprovalEmailData): string {
  const { guestName, eventName, eventDate, ticketUrl, qrCodeDataUrl, entryPrice, plusOneCode } = data
  const entryFeeLabel = entryPrice === 0
    ? "Free"
    : `€${entryPrice % 1 === 0 ? entryPrice : entryPrice.toFixed(2)}`

  const plusOneSection = plusOneCode ? `
              <!-- +1 Code for crew -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;border:1px solid #2a1a3a;">
                <tr>
                  <td style="padding:20px 24px;background-color:#0d0a12;">
                    <p style="margin:0 0 6px 0;font-size:9px;letter-spacing:0.25em;text-transform:uppercase;color:#7c4daa;">Your +1 Invite</p>
                    <p style="margin:0 0 16px 0;font-size:13px;color:#cccccc;line-height:1.6;font-weight:300;">
                      As a crew member you get one free entry for a friend.<br/>
                      Share this code with them — it&rsquo;s single-use.
                    </p>
                    <div style="display:inline-block;padding:12px 24px;background-color:#1a0a2a;border:1px solid #5b2e8a;">
                      <span style="font-size:22px;letter-spacing:0.35em;color:#c084fc;font-family:'Courier New',Courier,monospace;font-weight:600;">${plusOneCode}</span>
                    </div>
                    <p style="margin:12px 0 0 0;font-size:10px;letter-spacing:0.1em;color:#555555;">
                      Your friend enters this code at registration.
                    </p>
                  </td>
                </tr>
              </table>` : ""

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You're on the list — ${eventName}</title>
</head>
<body style="margin:0;padding:0;background-color:#000000;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#000000;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="540" cellpadding="0" cellspacing="0" style="max-width:540px;width:100%;background-color:#0a0a0a;border:1px solid #1a1a1a;">

          <!-- Header -->
          <tr>
            <td style="padding:48px 40px 32px 40px;border-bottom:1px solid #1a1a1a;">
              <p style="margin:0 0 16px 0;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:#555555;">Night Vision</p>
              <h1 style="margin:0;font-size:32px;font-weight:300;color:#ffffff;letter-spacing:-0.02em;line-height:1.2;">
                You&rsquo;re on<br/>the list.
              </h1>
              <div style="margin-top:20px;width:24px;height:1px;background-color:#ffffff;opacity:0.4;"></div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              <p style="margin:0 0 8px 0;font-size:13px;color:#999999;letter-spacing:0.05em;">Hey ${guestName},</p>
              <p style="margin:0 0 32px 0;font-size:15px;color:#cccccc;line-height:1.7;font-weight:300;">
                Your application for <strong style="color:#ffffff;font-weight:400;">${eventName}</strong> has been approved.<br/>
                Your entry ticket is below. Present the QR code at the door.
              </p>

              <!-- Event info -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;border:1px solid #1a1a1a;">
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #1a1a1a;">
                    <p style="margin:0 0 4px 0;font-size:9px;letter-spacing:0.25em;text-transform:uppercase;color:#555555;">Event</p>
                    <p style="margin:0;font-size:14px;color:#ffffff;font-weight:300;">${eventName}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #1a1a1a;">
                    <p style="margin:0 0 4px 0;font-size:9px;letter-spacing:0.25em;text-transform:uppercase;color:#555555;">Date</p>
                    <p style="margin:0;font-size:14px;color:#ffffff;font-weight:300;">${eventDate}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 4px 0;font-size:9px;letter-spacing:0.25em;text-transform:uppercase;color:#555555;">Entry Fee</p>
                    <p style="margin:0;font-size:14px;color:#ffffff;font-weight:300;">${entryFeeLabel}</p>
                  </td>
                </tr>
              </table>

              <!-- QR Code -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td align="center" style="padding:32px;background-color:#000000;border:1px solid #1a1a1a;">
                    <img
                      src="${qrCodeDataUrl}"
                      alt="Entry QR Code"
                      width="200"
                      height="200"
                      style="display:block;border:0;"
                    />
                    <p style="margin:16px 0 0 0;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#444444;">Scan at the door</p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td align="center">
                    <a
                      href="${ticketUrl}"
                      style="display:inline-block;padding:14px 40px;background-color:#ffffff;color:#000000;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;text-decoration:none;font-weight:500;"
                    >
                      Open Ticket
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:12px;color:#555555;line-height:1.7;">
                If the button above doesn&rsquo;t work, copy this link into your browser:<br/>
                <a href="${ticketUrl}" style="color:#888888;word-break:break-all;">${ticketUrl}</a>
              </p>
            </td>
          </tr>

          ${plusOneSection ? `
          <!-- +1 Code section -->
          <tr>
            <td style="padding:0 40px 32px 40px;">
              ${plusOneSection}
            </td>
          </tr>` : ""}

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #1a1a1a;">
              <p style="margin:0;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#333333;">
                Night Vision &mdash; Do not reply to this email
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
