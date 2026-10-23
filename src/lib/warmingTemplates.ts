/**
 * Warming message templates — natural, short, conversational.
 *
 * Deliberately NOT in the campaign catalog: these are bot traffic for the
 * warming peer pool, not user-selectable templates. No {{variable}}
 * placeholders — recipients are other coldflow accounts in the pool.
 *
 * Keep subjects varied and plain-English. No "Re:" prefixes, no sales
 * phrasing, no links. The goal is to look like real human mail.
 */

export interface WarmingTemplate {
  subject: string
  body: string
}

export const WARMING_TEMPLATES: WarmingTemplate[] = [
  {
    subject: 'quick thought',
    body: `Hey,

I was just thinking about that article you shared last month about async standups. Did your team actually try it? Curious how it went.

Talk soon,`,
  },
  {
    subject: 'coffee next week?',
    body: `Hey,

Would you be up for coffee next Tuesday or Wednesday? I'm around town both days and it'd be good to catch up.

Let me know what works,`,
  },
  {
    subject: 're: dinner thursday',
    body: `Sounds good. 7pm works for me. I'll swing by then.

See you Thursday,`,
  },
  {
    subject: 'that book',
    body: `Hey,

Finally finished the book you lent me. The chapter on compounding habits was the one that stuck with me. Returning it next time I see you.

Thanks for the loan,`,
  },
  {
    subject: 'weekend plans',
    body: `Hey,

Any plans this weekend? Thinking of heading up to the park Saturday morning if the weather holds. Let me know if you want to join.

Cheers,`,
  },
  {
    subject: 'photos from last weekend',
    body: `Hey,

Finally sorted through the photos. Nothing fancy but a few turned out really nice. I'll drop them in a shared folder when I'm back at my laptop later.

Talk soon,`,
  },
  {
    subject: 'running race signup',
    body: `Hey,

Did you ever end up signing up for that 10K? I was thinking of doing it too but want to see if we can coordinate training.

Let me know,`,
  },
  {
    subject: 'quick question',
    body: `Hey,

Random one but do you remember the name of that podcast you mentioned a few weeks back? The one about the restaurant guy. Can't find it in my history.

Thanks,`,
  },
  {
    subject: 're: your note',
    body: `Thanks for sending that over. Really appreciate you thinking of me. I'll take a look this weekend and send back my thoughts.

Talk soon,`,
  },
  {
    subject: 'house project update',
    body: `Hey,

The kitchen reno is finally done. Took three weeks longer than the contractor promised but it looks great. Come by whenever you're free.

Cheers,`,
  },
  {
    subject: 'that recipe',
    body: `Hey,

Tried your pasta recipe last night. The lemon zest made all the difference. Thanks for sharing it.

Talk soon,`,
  },
  {
    subject: 'reminder about friday',
    body: `Hey,

Just a quick reminder about Friday night — 6:30 at the usual spot. Let me know if anything comes up on your end.

See you then,`,
  },
  {
    subject: 'kids school event',
    body: `Hey,

The school recital is next Thursday evening if you want to come watch. Starts at 6:30, usually runs about an hour.

Hope you can make it,`,
  },
  {
    subject: 'parking spot',
    body: `Hey,

Thanks for letting me know about the spot behind the building. Grabbed it this morning and saved myself twenty minutes of circling.

Appreciate it,`,
  },
  {
    subject: 'cabin trip',
    body: `Hey,

Still thinking about that cabin trip we talked about. The place I was looking at has openings in late October. Want me to book it?

Let me know,`,
  },
  {
    subject: 'tools returned',
    body: `Hey,

Dropped the drill and the two bits back on your porch this afternoon. Thanks for the loan, it saved the whole weekend.

Talk soon,`,
  },
  {
    subject: 'new place',
    body: `Hey,

Finally got the keys. Moving in starts next Saturday if you're free to help. Pizza and beer on me after.

Appreciate it,`,
  },
  {
    subject: 'birthday card',
    body: `Hey,

Hope you had a great birthday yesterday. Sorry I missed the dinner — totally slipped my mind, feel awful about it. Let's catch up this week.

Talk soon,`,
  },
]

export function pickRandomWarmingTemplate(): WarmingTemplate {
  const idx = Math.floor(Math.random() * WARMING_TEMPLATES.length)
  return WARMING_TEMPLATES[idx]
}
