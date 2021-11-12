import Imap from "imap";
import { simpleParser } from 'mailparser';
import fs from "fs/promises";
import { Address, ReceivedEmail } from "./types";
import env from "./env";

export async function saveEmailsToFile(emails: ReceivedEmail[], path: string = './emails.json'): Promise<void> {
  return fs.writeFile(path, JSON.stringify(emails), { encoding: 'utf-8' });
}

export async function readEmailsFromFile(path: string = './emails.json'): Promise<ReceivedEmail[]> {
  return JSON.parse(await fs.readFile(path, { encoding: 'utf-8' })).map((e: Omit<ReceivedEmail, 'date'> & { date: string }) => ({ ...e, date: new Date(e.date) }));
}

export async function getEmails(query = ["UNSEEN"]): Promise<ReceivedEmail[]> {  
  const imap = await getImap();
  return new Promise<ReceivedEmail[]>((resolve, reject) => {
    imap.search(query, (err, results) => {
      if (err) {
        reject(err);
        return;
      }
      if (results.length == 0) {
        resolve([]);
        return;
      }
      
      const f = imap.fetch(results, { bodies: '', markSeen: false });
      const emailPromises: Promise<ReceivedEmail | undefined>[] = [];
      
      f.on("message", (msg, seqno) => {
        let uid: number;
        let buffer = "";

        msg.on("body", (stream, info) => {
          stream.on("data", (chunk) => buffer += chunk.toString("utf8"));
        });

        msg.on("attributes", (attrs) => {
          uid = attrs.uid;
        });

        msg.on("end", () => {
          emailPromises.push(parseEmail(uid, buffer));
        });
      });

      f.once("error", reject);

      f.once("end", async () => {
        const emails: ReceivedEmail[] = (await Promise.all(emailPromises)).filter((a): a is ReceivedEmail => a !== undefined);
        resolve(emails);
      });
    });
  });
}

async function parseEmail(uid: number, content: string): Promise<ReceivedEmail | undefined> {
  const pm = await simpleParser(content);

  if (pm.messageId === undefined) {
    console.warn('Discarding email as it does not have a message id');
    return;
  }
  if (pm.date === undefined) {
    console.warn('Discarding email ' + pm.messageId + ' as it does not have a date');
    return;
  }
  if (pm.from === undefined) {
    console.warn('Discarding email ' + pm.messageId + ' as it does not have a from header (Date: ' + pm.date + ', Subject: ' + pm.subject + ')');
    return;
  }
  const from = pm.from.value.filter((a): a is Address => a.address !== undefined)[0];
  if (!from) {
    console.warn('Discarding email ' + pm.messageId + ' as it does not have a from address (Date: ' + pm.date + ')');
    return;
  }
  if (pm.html === false) {
    console.warn('Discarding email ' + pm.messageId + ' as it does not have html (Date: ' + pm.date + ', From: ' + from.address + ', Subject: ' + pm.subject + ')');
    return;
  }
  if (pm.text === undefined) {
    console.warn('Discarding email ' + pm.messageId + ' as it does not have text (Date: ' + pm.date + ', From: ' + from.address + ', Subject: ' + pm.subject + ')');
    return;
  }

  const forceArr = <T>(arg: T | T[] | undefined): T[] => {
    if (arg === undefined) return [];
    if (Array.isArray(arg)) return arg;
    return [arg];
  }

  const replyToHeader = pm.replyTo?.value.filter((a): a is Address => a.address !== undefined);
  const replyTo = replyToHeader === undefined || replyToHeader.length === 0 ? [from] : replyToHeader;

  return {
    subject: pm.subject || '',
    html: pm.html,
    text: pm.text,
    newText: extractNewText(pm.text),
    attachments: pm.attachments,

    uid,
    messageId: pm.messageId,
    references: forceArr(pm.references),
    
    date: pm.date,

    to: forceArr(pm.to).flatMap(a => a.value).filter((a): a is Address => a.address !== undefined),
    cc: forceArr(pm.cc).flatMap(a => a.value).filter((a): a is Address => a.address !== undefined),
    bcc: forceArr(pm.bcc).flatMap(a => a.value).filter((a): a is Address => a.address !== undefined),
    from,
    replyTo,
  }
}

function extractNewText(fullText: string): string {
  // Remove all lines in a contingious block at the end of the email beginning with >
  const textLines = fullText.trim().split('\n');
  let i = textLines.length - 1;
  while (i >= 0 && textLines[i].startsWith('>')) i--;
  const quotesRemoved = textLines.slice(0, i + 1).join('\n').trim();

  // Remove anything after a 'On ... wrote:'
  const match = quotesRemoved.trim().match(/(.*?)On .*? wrote:/s);
  const newText = match ? match[1].trim() : quotesRemoved;

  return newText;
}

export async function markAsRead(messageSource: number | number[]): Promise<void> {
  const imap = await getImap();
  return new Promise((resolve, reject) => {
    imap.addFlags(messageSource, ['\\SEEN'], (err) => {
      if (err) return reject(err);
      console.log('Message ' + messageSource + ' marked as read');
      resolve();
    });
  });
}

let _getImapInstance: Promise<Imap>;
async function getImap(): Promise<Imap> {
  if (_getImapInstance) return _getImapInstance;

  const imap = new Imap(env.imapOptions);
  _getImapInstance = new Promise<Imap>(resolve => {
    imap.once("ready", () => {
      imap.openBox("INBOX", false, (err, box) => {
        if (err) throw err;
        resolve(imap);
      });
    });
    imap.connect();
  });
  return _getImapInstance;
}

export async function closeImap() {
  if (_getImapInstance && (await _getImapInstance).state !== 'disconnected') {
    (await _getImapInstance).end();
  }
}