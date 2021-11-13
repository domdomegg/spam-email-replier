# spam-emailer-replier

If you can't beat them, join them! Automatically replies to spam emails.

## Setup

1. `npm install`
2. Add your credentials to `src/env.ts`

If you need to create some credentials, I recommend Outlook. It's legit enough to bait scammers, but doesn't have security measures that are as annoying for our purposes (e.g. Google will refuse to send out a bunch of emails sent out by a script connecting to it). If you are using Outlook and you get the error `LOGIN failed`, try visiting [account.live.com/activity]( https://account.live.com/activity), finding your session and clicking 'This was me', then trying again.

## Usage

Run `npm start`

NB: some providers will add your IP to the email headers, so you may want to use a proxy, VPN or similar.
