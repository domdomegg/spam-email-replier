# spam-email-replier

> **Archived.** This was a fun experiment and is no longer maintained.

Automatically replies to spam/scam emails with plausible but nonsensical responses, wasting the spammer's time.

## How it worked

1. Connected to an Outlook/Hotmail inbox via IMAP and fetched unseen emails
2. Analysed each email and generated a contextual reply using hardcoded templates (e.g. filling out phishing forms with fake details, asking scammers to resend broken links, complaining about banking services)
3. Presented each draft reply to the user for approval via a CLI prompt
4. Sent approved replies via SMTP, with proper email threading headers

Built with TypeScript, using `imap` for receiving, `nodemailer` for sending, and `mailparser` for parsing.
