import nodemailer, { Transporter } from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import env from "./env";
import { ReceivedEmail, SendingEmail } from "./types";

export async function sendEmail(email: SendingEmail, transporter: Transporter<SMTPTransport.SentMessageInfo> | Promise<Transporter<SMTPTransport.SentMessageInfo>> = getEtherealEmailTransporter()) {  
  const info = await (await transporter).sendMail({
    from: env.fromOptions,
    to: email.to,
    subject: email.subject,
    text: email.text,
    html: email.html,
    inReplyTo: email.inReplyTo,
    references: email.references,
    textEncoding: 'quoted-printable'
  });

  console.log("Message sent: %s", info.messageId);
  // @ts-ignore - incorrect type definitions, the options object does have a host sometimes
  if ((await transporter).options.host === "smtp.ethereal.email") {
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  }
}
  
export async function getHotmailTransporter() {
  return nodemailer.createTransport(env.nodeMailerTransportOptions);
}
  
export async function getEtherealEmailTransporter() {
  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
}

export function makeReply(receivedEmail: ReceivedEmail, replyText: string): SendingEmail {
  const sendingSubject = receivedEmail.subject.startsWith('Re:') ? receivedEmail.subject : 'Re: ' + receivedEmail.subject;
  const sendingReferences = [...receivedEmail.references, receivedEmail.messageId];
  
  const text = replyText + '\n\nOn ' + receivedEmail.date.toUTCString().slice(0, 16) + ', ' + receivedEmail.date.toUTCString().slice(17, 22) + ' ' + receivedEmail.from.name + ', <' + receivedEmail.from.address + '> wrote:\n\n' + receivedEmail.text.split('\n').map(l => l.startsWith('>') ? '>' + l : '> ' + l).join('\n');
  const html = '<html><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><style type="text/css" style="display:none;"> P {margin-top:0;margin-bottom:0;} </style></head><body dir="ltr"><div style="font-family: Calibri, Arial, Helvetica, sans-serif; font-size: 12pt; color: rgb(0, 0, 0);">' + replyText.replace(/\n/g, '<br>') + '</div><div id="appendonsend"></div><hr style="display:inline-block;width:98%" tabindex="-1"><div id="divRplyFwdMsg" dir="ltr"><font face="Calibri, sans-serif" style="font-size:11pt" color="#000000"><b>From:</b> ' + receivedEmail.from.name + ' &lt;' + receivedEmail.from.address + '&gt;<br><b>Sent:</b> ' + receivedEmail.date.toUTCString().slice(0, 3) + ' ' + receivedEmail.date.toUTCString().slice(5, 22) + '<br>' + (receivedEmail.to.length === 0 ? '' : '<b>To:</b> ' + receivedEmail.to.map(a => a.name + ' &lt;' + a.address + '&gt;').join('; ') + '<br>') + '<b>Subject:</b> ' + receivedEmail.subject + '</font><div>&nbsp;</div></div><div>' + receivedEmail.html.replace(/^<meta .*?>/, '') + '</div></body></html>';
  
  return {
    to: receivedEmail.replyTo,
    subject: sendingSubject,
    text,
    html,
    newText: replyText,
    inReplyTo: receivedEmail.messageId,
    references: sendingReferences
  };
}
