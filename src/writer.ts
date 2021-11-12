import env from "./env";
import { makeReply } from "./sending";
import { ReceivedEmail, SendingEmail } from "./types";

const emailRegex = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/g;

export async function write(receivedEmail: ReceivedEmail): Promise<SendingEmail[]> {
    const extras: SendingEmail[] = [];
    let content = 'Hi,\n\nI haven\'t heard back yet - please can you send the details?\n\nThanks,\n' + env.name.first + ' ' + env.name.last;

    // TODO: some funky ML stuff to classify emails

    const text = receivedEmail.newText.toLowerCase();

    if (text.includes('……') || text.includes('......')) {
        const form = text.split('\n').filter(line => line.includes('……') || line.includes('......')).join('\n');
        content = 'Thanks, I have filled out the form you sent:\n\n' + form + '\n\n' + env.name.first;
    }

    else if (text.includes(' visa card ') || text.includes(' visa card.')) {
        content = 'Hello,\n\nThank you very much for this good news! I am pleased to hear this as I am taking Denise and Charlie on holiday next month to France. They\'re my grandchildren - Denise is just starting her GCSEs while Charlie has been working hard getting into secondary school. Will the visa card work in France? It would be good to treat them there. I think France uses euros, but I don\'t know what the conversion rate is.\n\nThanks,\n' + env.name.first
    }

    else if (text.includes('http://') || text.includes('https://')) {
        content = 'I tried to click the link you sent in your last email to understand better but it didn\'t work. Can you try resending it?\n\n' + env.name.first;
    }

    else if (text.includes(' bank ') || text.includes(' bank.')) {
        content = 'Hello,\n\nI\'m not sure I follow - my bank is HSBC, will that work? I haven\'t been in my local branch for a long time because of COVID so I don\'t think I can do much of my banking now.\n\nAlso, as you\'re from the bank I want to make a complaint while I have you. The last time I went there was a Samantha in there who was very rude to me. I asked for a new chequebook but she said she couldn\'t issue one any more as I am not a premier customer. I cannot believe you treat your customers like this, I understand there are different tiers but all customers should at least have access to such basic services. Because of this I am thinking of switching bank despite being with HSBC for 14 years. Please can you look into this as a matter of urgency.\n\n' + env.name.first + ' ' + env.name.last;
    }

    const emailMatches = text.match(emailRegex);
    if (emailMatches !== null) {
        const extraContent = 'Hello,\n\nI was told to contact you to continue. Please tell me the next steps.\n\nThanks,\n' + env.name.first;
        extras.push({
            subject: 'Details',
            html: '<html><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><style type="text/css" style="display:none;"> P {margin-top:0;margin-bottom:0;} </style></head><body dir="ltr"><div style="font-family: Calibri, Arial, Helvetica, sans-serif; font-size: 12pt; color: rgb(0, 0, 0);">' + extraContent + '</div></body></html>',
            text: extraContent,
            newText: extraContent,
            references: [],
            to: [{ name: emailMatches[0], address: emailMatches[0] }]
        })
    }

    return [makeReply(receivedEmail, content), ...extras];
}