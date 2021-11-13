import { closeImap, getEmails, markAsRead, readEmailsFromFile } from "./receiving";
import { getHotmailTransporter, sendEmail } from "./sending";
import { write } from "./writer";

import readline from 'readline';
function askQuestion(query: string) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }))
}

export async function main() {
  // const emails = await readEmailsFromFile();
  const emails = await getEmails();

  // TODO: could improve parallelisation here
  for (const email of emails) {
    const responses = await write(email);
    for (const response of responses) {
      console.dir({ original: email.newText, response: response.newText, to: response.to.map(a => a.address) })
      const command = await askQuestion('Happy to proceed (y/n/s[kip]/s[kip]/s[kip]n[oread])? ');
      if (command === 's' || command === 'skip') {
        await markAsRead(email.uid);
        continue;
      }
      if (command === 'sn' || command === 'skipnoread') continue;
      if (command !== 'y') return;

      await sendEmail(response, getHotmailTransporter());
      await markAsRead(email.uid);
    }
  }

  await closeImap();
}

main().catch(console.error);
