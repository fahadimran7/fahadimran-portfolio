---
title: Taking card payments without ever storing the card
publishedAt: "2026-07-13"
summary: At Nomod we kept adding card providers to cut fees and stay resilient. Each one came with its own card fields, and that quietly put us out of PCI compliance. Here's how we ended up charging cards we never hold, by tokenizing every provider through Basis Theory.
published: true
---

This is the first of a few posts about work I did at [Nomod](https://nomod.com), where I've been building the payments front end. Nomod lets a merchant take card payments on their phone, no terminal, no hardware. The kind of thing a market stall or a freelancer can open and start charging a card with in a couple of minutes.

This one is about the least glamorous problem you can have in payments: staying compliant while you add more and more ways to charge a card. It doesn't sound like much. It turned into one of the bigger pieces of front-end work I did there.

## Why we kept adding payment providers

When I joined, the setup was simple. We had Stripe and Checkout.com, each with their own hosted card form, plus Google Pay and Apple Pay wired up on top. Two providers, done.

The thing is, every card payment has a cost baked into it, and that cost isn't one number. When someone pays, the fee splits a few ways. The biggest slice, interchange, goes to the bank that issued the customer's card. A smaller slice, the scheme or assessment fee, goes to the network, Visa or Mastercard. And on top of those sits the provider's own markup, which is the part they actually compete on.

A provider can quote you all of that as a single blended rate, one number like "2.9% plus a fixed fee" that rolls everything together, or as interchange-plus, which shows you each piece and only marks up the last one. Blended is simpler to read but you quietly overpay on cheap transactions to subsidise the expensive ones. Interchange-plus is more transparent, and as your volume grows the markup is the number you go back and renegotiate.

None of it is fixed, either. What you're charged depends on region, card type, volume, and frankly how good a deal you can strike. So the more providers we could plug in, the more room we had to route a payment through whoever was cheapest for that particular charge, and the more leverage we had at the table when it was time to talk rates.

There was a second reason, and it mattered just as much. If you only have one or two providers and one of them goes down, you're stuck. Adding more gave us somewhere to route to when a provider had an outage. Cheaper on a good day, resilient on a bad one.

So we started adding them. MyFatoorah first, which had genuinely great rates, then Noon, AFS, Adyen, MBME. Each one was another option in the pot. (MyFatoorah we eventually moved off. The rates were the best we had at first, but they came back wanting to renegotiate to something far higher, and between the new numbers and the complications that came with it, the deal stopped being the deal we signed up for. Which is its own small lesson: the best rate today isn't the same thing as a deal you can count on.)

## The problem nobody sees until it's a problem

Here's where it got awkward.

Quick background first, because this is the whole game. PCI DSS is the security standard that covers anyone who handles card data, and the important part is that your compliance burden scales with how much of that data actually flows through your systems. Touch raw card numbers yourself and you're in the deep end: the serious audits, the long questionnaire, real obligations. Never let a raw card number near your servers and you fall into the lightest tier, where a compliant provider handles the sensitive bit and all you have to prove is that you handed it off cleanly and never held it. That lightest tier is exactly where you want to be, and it's where Stripe and Checkout had us to start with.

Those tiers have names. PCI sorts merchants into self-assessment questionnaires, SAQs, based on how card data reaches you. Roughly:

| SAQ | Who it's for | How heavy |
| --- | --- | --- |
| **A** | You fully outsource card handling; the number never touches your systems | Lightest, around 24 questions |
| **A-EP** | Your page doesn't receive the card data but you control the page it's entered on | Much heavier, around 139 questions |
| **B** | Card taken only by standalone dial-out terminals or old imprint machines | Small |
| **C** | A payment app connected to the internet, but no card data stored electronically | Medium |
| **D** | Everything else, including anyone who stores card numbers | Heaviest, the full standard |

SAQ A is the one you want. Shortest questionnaire, lightest obligations, and you only qualify if you genuinely never touch the card. That was the whole target: keep every provider in a world where we could honestly answer SAQ A.

Stripe and Checkout both hand you a proper hosted card form. Their SDK renders the fields, the raw card number never touches your servers, they tokenize it inside their own vault. That's the whole point of using them: you stay out of PCI scope because you never actually hold card data.

The new providers didn't all work that way. For MyFatoorah in particular, we ended up collecting the card number, CVC and expiry with our own fields. Which means the raw card details were passing through our front end. And the moment that's true, you are in PCI scope, and we weren't set up to be.

So we'd solved the cost-and-resilience problem and quietly created a compliance one. Every provider we added to save money was another card form we controlled, and the more of those we had, the further out of scope we drifted.

## Why we couldn't just keep the card ourselves

The obvious question is: why not save the card number and charge it whenever we want? Plenty of businesses feel like they ought to be able to.

The long number on the front of the card is the PAN, the primary account number. It's the sensitive thing PCI is built around, and the rules for holding it are strict for good reason. You are allowed to store it, but only rendered unreadable, and here's the catch that trips people up: encrypting it doesn't get you off the hook. The PCI council treats an encrypted PAN as basically the same as a plain one for scope, because encryption is reversible. If you can decrypt it to charge a card, so can whoever steals your keys. Encrypt all you like, you're still holding cardholder data and still in the deep end.

Fine, you think, hash it. Hashing is one-way, so a hash is genuinely useless to a thief. Trouble is it's just as useless to you, because to actually charge a card you have to hand the real number to the processor. The charge needs the PAN in the clear at the moment it happens. You can't send a hash to Visa.

So you're stuck between two bad options: hold the real number and live in full PCI scope forever, or find a way to charge a card you don't keep. Tokenization is that second option. Someone else holds the PAN, you hold a token that's worthless if stolen, and the real number only reappears at the instant of the charge, inside a compliant provider, never on your servers.

That someone else is what we went looking for. We needed a way to keep adding providers without ever touching raw card data ourselves.

## The plan: one form, and let someone else hold the card

The answer we landed on was [Basis Theory](https://basistheory.com). The idea is that they own the tokenization. The card fields live inside their elements, the raw data goes straight to them, and we get back a token. We never see the number.

But the part I actually cared about was this: we could build **one** card form, and use it for every provider. Stripe, Checkout, Noon, AFS, Adyen, MBME, whatever came next. Same form, same fields, same code. Basis Theory tokenizes the card, and the backend decides which provider that token gets sent to. The front end stops caring who's processing the payment.

That was the goal. One dynamic form, out of PCI scope for good, and no dependence on any single provider's proprietary SDK just to collect a card.

## How Basis Theory actually holds the card

The card fields on screen are Basis Theory's, dropped into our form and styled until they look like ours. When someone types their card in, that data goes straight to Basis Theory, not to us, and we get back a reference to it. The number itself lands in their vault. We only ever hold the reference.

We used **token intents** for that reference rather than long-lived tokens. A token intent is a short-lived placeholder for the card, built for exactly this: collect the details, run whatever has to happen before a charge, then let it expire. They're gone in about a day by default, and we didn't want it any longer. Storing cards permanently means storing something valuable, which means more risk and, honestly, more cost with Basis Theory for holding data we had no reason to keep. We weren't building a save-your-card feature. We just needed the card to survive long enough to charge it once.

Then comes the part that makes the whole thing work: how a token turns back into a real card without the card ever coming back to us. When it's time to charge, we don't pull the number out of the vault and forward it. We send the charge *through* Basis Theory's proxy, and it detokenizes in flight, swapping the token for the real PAN on the way to the provider. The card goes vault to provider and never once passes through our servers, not on the way in and not on the way out. That round trip, card in without touching us, card out without touching us, is the entire reason we could keep answering SAQ A while still running the charge ourselves.

The front-end machinery around all this is a separate concern from card handling, so I'll keep this post to the card and leave that for another day.

<figure>
  <svg viewBox="0 0 760 430" role="img" aria-label="Flow diagram: the one form sends the raw card to Basis Theory and gets a token back, then sends the token plus the backend-chosen provider to our backend, which routes the charge to one of several payment providers." xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;font-family:inherit">
    <defs>
      <marker id="bt-ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0 0 L10 5 L0 10 z" fill="var(--muted)" />
      </marker>
    </defs>
    <!-- Basis Theory -->
    <rect x="40" y="28" width="200" height="88" rx="11" fill="var(--chip-bg)" stroke="var(--border)" />
    <text x="140" y="64" text-anchor="middle" font-size="15" font-weight="600" fill="var(--text)">Basis Theory</text>
    <text x="140" y="86" text-anchor="middle" font-size="12" fill="var(--muted)">tokenizes the card</text>
    <text x="266" y="58" font-size="12" fill="var(--muted)">the raw card goes straight here,</text>
    <text x="266" y="76" font-size="12" fill="var(--muted)">it never touches our servers.</text>
    <text x="266" y="99" font-size="12" fill="var(--muted)">at charge time it swaps the token</text>
    <text x="266" y="117" font-size="12" fill="var(--muted)">back for the card. still never us.</text>
    <!-- The one form -->
    <rect x="40" y="180" width="200" height="96" rx="11" fill="var(--chip-bg)" stroke="var(--text)" stroke-width="1.6" />
    <text x="140" y="214" text-anchor="middle" font-size="15" font-weight="600" fill="var(--text)">The one form</text>
    <text x="140" y="235" text-anchor="middle" font-size="12" fill="var(--muted)">Basis Theory elements,</text>
    <text x="140" y="252" text-anchor="middle" font-size="12" fill="var(--muted)">styled as ours</text>
    <!-- Our backend -->
    <rect x="520" y="180" width="200" height="96" rx="11" fill="var(--chip-bg)" stroke="var(--border)" />
    <text x="620" y="214" text-anchor="middle" font-size="15" font-weight="600" fill="var(--text)">Our backend</text>
    <text x="620" y="235" text-anchor="middle" font-size="12" fill="var(--muted)">picks the provider &amp;</text>
    <text x="620" y="252" text-anchor="middle" font-size="12" fill="var(--muted)">processes the charge</text>
    <!-- form <-> Basis Theory -->
    <line x1="112" y1="178" x2="112" y2="120" stroke="var(--muted)" stroke-width="1.3" marker-end="url(#bt-ar)" />
    <text x="104" y="153" text-anchor="end" font-size="11" fill="var(--muted)">raw card</text>
    <line x1="168" y1="118" x2="168" y2="178" stroke="var(--muted)" stroke-width="1.3" marker-end="url(#bt-ar)" />
    <text x="176" y="153" font-size="11" fill="var(--muted)">token</text>
    <!-- form -> backend -->
    <line x1="240" y1="210" x2="518" y2="210" stroke="var(--muted)" stroke-width="1.3" marker-end="url(#bt-ar)" />
    <text x="379" y="201" text-anchor="middle" font-size="11" fill="var(--muted)">token + chosen provider</text>
    <!-- backend -> form (config, dashed) -->
    <line x1="520" y1="250" x2="242" y2="250" stroke="var(--muted)" stroke-width="1.3" stroke-dasharray="5 4" marker-end="url(#bt-ar)" />
    <text x="379" y="269" text-anchor="middle" font-size="11" fill="var(--muted)">config: which provider to use</text>
    <!-- backend -> providers -->
    <line x1="620" y1="276" x2="620" y2="330" stroke="var(--muted)" stroke-width="1.3" marker-end="url(#bt-ar)" />
    <text x="632" y="300" font-size="11" fill="var(--muted)">charge:</text>
    <text x="632" y="314" font-size="11" fill="var(--muted)">token &#8594; card</text>
    <!-- providers -->
    <rect x="300" y="332" width="420" height="84" rx="11" fill="var(--chip-bg)" stroke="var(--border)" />
    <text x="316" y="356" font-size="11" font-weight="600" fill="var(--muted)" letter-spacing="0.04em">PAYMENT PROVIDERS</text>
    <g font-size="11.5" font-weight="550" text-anchor="middle">
      <g class="dchip" style="--h:265"><rect x="314" y="370" width="60" height="28" rx="8" /><text x="344" y="388">Stripe</text></g>
      <g class="dchip" style="--h:210"><rect x="380" y="370" width="60" height="28" rx="8" /><text x="410" y="388">Checkout</text></g>
      <g class="dchip" style="--h:35"><rect x="446" y="370" width="60" height="28" rx="8" /><text x="476" y="388">Noon</text></g>
      <g class="dchip" style="--h:145"><rect x="512" y="370" width="60" height="28" rx="8" /><text x="542" y="388">AFS</text></g>
      <g class="dchip" style="--h:175"><rect x="578" y="370" width="60" height="28" rx="8" /><text x="608" y="388">Adyen</text></g>
      <g class="dchip" style="--h:330"><rect x="644" y="370" width="60" height="28" rx="8" /><text x="674" y="388">MBME</text></g>
    </g>
  </svg>
  <figcaption>The high-level shape of it. The card goes straight to Basis Theory for a token on the way in, and at charge time Basis Theory swaps that token back for the real card on the way out to the provider. We never hold the number in either direction.</figcaption>
</figure>

## Migrating everything over, one provider at a time

This wasn't a rewrite we shipped in one go. It was a long, careful migration, done in phases, one provider per release so we could test each in production before moving on.

We went in this order:

1. **The card forms first**, starting with MBME, since those were the ones actually out of scope and the whole reason we were doing this.
2. **Then Checkout**, moving it off its own hosted form and onto the shared Basis Theory one.
3. **Then Stripe**, same move.

That last step is worth pausing on, because Stripe and Checkout didn't *have* to move. They were already compliant on their own SDKs. We migrated them anyway, onto the same shared form as everyone else. The reason was consistency. Once every provider went through one form, we could delete a huge amount of duplicated form code, styling, validation and state handling that existed once per provider. One form to maintain instead of six. The front end got noticeably smaller and simpler, and every provider behaved the same way.

(The wallets, Apple Pay and Google Pay, were the final phase, and they were their own kind of tangle because the wallet buttons were coupled to the underlying service. That decoupling was a job in itself, and I'll get to it another time.)

## The parts that didn't fit the happy path

Not everything ends at "tokenize and send." Some providers need a step after the card is captured, 3DS being the obvious one, and that applied across every provider rather than just one. We kept all of it out of the card form on purpose. The form's only job is to turn a card into a token; whatever has to happen after that lives somewhere else, so the capture stayed the same no matter how different the follow-up was.

How that "somewhere else" is put together, and how one generic form quietly served providers that behave nothing alike, is the interesting bit, and it's what the next post in this series is about.

## What we got out of it

The payoff is the boring, good kind. Adding a new provider became almost a non-event on the front end. No new form, no new styling, no new validation. The backend adds the service to its config, and the existing form just works. The front end genuinely didn't need to change.

I want to be honest about the split of work, though. The front end was the smaller half of this. The real weight was on the backend, routing, provider integrations, the config that drove everything, and this was a lot of close back-and-forth with the backend lead and the backend engineers, service by service. The front end still needed real thought up front, because the first time you set the architecture you have to get it right, and after that new providers slot in cheaply. But most of the visible cleverness lived on their side, not mine.

## What I'd do differently

Honestly, not much about the shape of it. The one form was the right call and it aged well.

If anything, I'd have pushed harder, earlier, to move Stripe and Checkout onto the shared form instead of leaving them on their own SDKs for as long as we did. We tolerated the duplication longer than we needed to because those two were already compliant, so there was no urgency. But the duplication was a quiet tax the whole time, and the migration was easier than we'd feared once we actually did it. The lesson I keep relearning: "it already works" is not the same as "it's worth keeping."
