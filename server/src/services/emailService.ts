import nodemailer from 'nodemailer';

interface SendInviteParams {
  toEmail: string;
  senderName: string;
  projectName: string;
  role: string;
  inviteLink: string;
}

const getEmailText = (senderName: string, projectName: string, role: string, inviteLink: string) => `
Hello,

${senderName} has invited you to join the project workspace "${projectName}" as a ${role.toLowerCase()}.

Accept Invitation & Join Project:
${inviteLink}

If the link above does not open directly, copy and paste this URL into your browser:
${inviteLink}
`;

const getEmailHtml = (senderName: string, projectName: string, role: string, inviteLink: string) => `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0;">
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; width: 48px; height: 48px; background: linear-gradient(135deg, #7c3aed, #4c1d95); border-radius: 12px; line-height: 48px; color: #ffffff; font-size: 20px; font-weight: bold;">TF</div>
      <h2 style="color: #0f172a; margin-top: 12px; margin-bottom: 4px; font-size: 20px;">Workspace Invitation</h2>
      <p style="color: #64748b; font-size: 13px; margin: 0;">TaskFlow Collaborative Workspace</p>
    </div>
    
    <p style="color: #334155; font-size: 14px; line-height: 1.6;">Hello,</p>
    <p style="color: #334155; font-size: 14px; line-height: 1.6;">
      <strong>${senderName}</strong> has invited you to join the project workspace <strong>"${projectName}"</strong> as a <strong>${role.toLowerCase()}</strong>.
    </p>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${inviteLink}" target="_blank" style="background-color: #7c3aed; color: #ffffff; font-size: 13px; font-weight: 600; padding: 12px 24px; text-decoration: none; border-radius: 12px; display: inline-block; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.25);">
        Accept Invitation & Join Project
      </a>
    </div>

    <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
      If the button above does not open directly, copy and paste this URL into your browser:<br>
      <a href="${inviteLink}" style="color: #7c3aed; word-break: break-all;">${inviteLink}</a>
    </p>
  </div>
`;

export const sendProjectInviteEmail = async ({
  toEmail,
  senderName,
  projectName,
  role,
  inviteLink,
}: SendInviteParams): Promise<boolean> => {
  try {
    const brevoApiKey = process.env.BREVO_API_KEY;
    const resendApiKey = process.env.RESEND_API_KEY;
    const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASS;
    const smtpHost = process.env.SMTP_HOST || 'smtp-relay.brevo.com';
    const smtpPort = Number(process.env.SMTP_PORT) || 587;

    // Use verified sender email
    const senderEmail = process.env.SENDER_EMAIL || 'srivastavaamal013@gmail.com';

    // 1. Brevo REST API Dispatch (Using verified srivastavaamal013@gmail.com sender)
    if (brevoApiKey) {
      try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'api-key': brevoApiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            sender: { name: 'TaskFlow Workspaces', email: senderEmail },
            to: [{ email: toEmail }],
            subject: `Workspace Invitation: Join "${projectName}" on TaskFlow`,
            htmlContent: getEmailHtml(senderName, projectName, role, inviteLink),
            textContent: getEmailText(senderName, projectName, role, inviteLink),
          }),
        });

        const resData: any = await response.json().catch(() => ({}));
        if (response.ok) {
          console.log(`✉️ Real email dispatched via Brevo API to ${toEmail}. MessageID:`, resData.messageId);
          return true;
        } else {
          console.error(`❌ Brevo API Error (${response.status}):`, resData);
        }
      } catch (brevoErr) {
        console.error('❌ Brevo API fetch exception:', brevoErr);
      }
    }

    // 2. Resend API Dispatch
    if (resendApiKey) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'onboarding@resend.dev',
            to: [toEmail],
            subject: `Workspace Invitation: Join "${projectName}" on TaskFlow`,
            html: getEmailHtml(senderName, projectName, role, inviteLink),
            text: getEmailText(senderName, projectName, role, inviteLink),
          }),
        });

        const resData: any = await response.json().catch(() => ({}));
        if (response.ok) {
          console.log(`✉️ Real email dispatched via Resend API to ${toEmail}`);
          return true;
        } else {
          console.error(`❌ Resend API Error (${response.status}):`, resData);
        }
      } catch (resErr) {
        console.error('❌ Resend API fetch exception:', resErr);
      }
    }

    // 3. SMTP Transport Dispatch (Gmail, Brevo SMTP, Outlook)
    if (smtpUser && smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        await transporter.sendMail({
          from: `"TaskFlow Workspaces" <${smtpUser}>`,
          to: toEmail,
          subject: `Workspace Invitation: Join "${projectName}" on TaskFlow`,
          text: getEmailText(senderName, projectName, role, inviteLink),
          html: getEmailHtml(senderName, projectName, role, inviteLink),
        });

        console.log(`✉️ Real email dispatched via SMTP (${smtpHost}) to ${toEmail}`);
        return true;
      } catch (smtpErr) {
        console.error('❌ SMTP dispatch exception:', smtpErr);
      }
    }

    console.warn(`⚠️ No active email service configured. Direct join link generated.`);
    return false;
  } catch (error) {
    console.error('❌ Email dispatch failed:', error);
    return false;
  }
};
