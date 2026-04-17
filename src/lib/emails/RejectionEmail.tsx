/**
 * @file src/lib/emails/RejectionEmail.tsx
 *
 * HTML email template for rejected guests.
 * Returns a plain HTML string.
 */

export interface RejectionEmailData {
  guestName: string
  eventName: string
  eventDate: string
}

export function renderRejectionEmail(data: RejectionEmailData): string {
  const { guestName, eventName, eventDate } = data

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Application update — ${eventName}</title>
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
                Application<br/>update.
              </h1>
              <div style="margin-top:20px;width:24px;height:1px;background-color:#ffffff;opacity:0.4;"></div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              <p style="margin:0 0 8px 0;font-size:13px;color:#999999;letter-spacing:0.05em;">Hey ${guestName},</p>
              <p style="margin:0 0 32px 0;font-size:15px;color:#cccccc;line-height:1.7;font-weight:300;">
                Thank you for your interest in <strong style="color:#ffffff;font-weight:400;">${eventName}</strong>
                on <strong style="color:#ffffff;font-weight:400;">${eventDate}</strong>.
              </p>
              <p style="margin:0 0 32px 0;font-size:15px;color:#cccccc;line-height:1.7;font-weight:300;">
                Unfortunately we are unable to offer you a spot at this event.
                Due to high demand, capacity is very limited and we had to make
                difficult decisions. We hope to see you at a future event.
              </p>
              <p style="margin:0;font-size:14px;color:#888888;line-height:1.7;font-weight:300;">
                Follow us on Instagram to stay informed about upcoming nights.
              </p>
            </td>
          </tr>

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
