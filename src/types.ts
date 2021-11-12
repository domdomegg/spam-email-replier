import type Connection from "imap";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

export interface Attachment {
  contentType: string;
  filename?: string;
}

export interface Address {
  address: string;
  name: string;
}

export interface ReceivedEmail {
  subject: string;
  html: string;
  text: string;
  /** represents the text new to this email, i.e. excluding previous replies */
  newText: string;
  attachments: Attachment[];

  uid: number;
  messageId: string;
  references: string[];
  
  date: Date;

  to: Address[];
  cc: Address[];
  bcc: Address[];
  from: Address;
  replyTo: Address[];
}

export interface SendingEmail {
  subject: string;
  html: string;
  text: string;
  /** represents the text new to this email, i.e. excluding previous replies */
  newText: string;
  // TODO: support
  // attachments: Attachment[];

  inReplyTo?: string;
  references: string[];

  to: Address[];
  cc?: Address[];
  bcc?: Address[];
}

export interface Env {
  nodeMailerTransportOptions: SMTPTransport.Options,
  imapOptions: Connection.Config,
  fromOptions: Address | string,
  name: { first: string, last: string },
}