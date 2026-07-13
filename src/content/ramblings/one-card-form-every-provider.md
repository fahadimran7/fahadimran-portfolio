---
title: One card form for every payment provider
publishedAt: "2026-07-13"
summary: At Nomod we kept adding card providers to cut fees and stay resilient. Each one came with its own card fields, and that quietly put us out of PCI compliance. Here's how we collapsed all of them into a single dynamic form with Basis Theory.
tags: ["Nomod", "Payments", "PCI", "Frontend", "Architecture"]
published: true
series: "nomod-payments"
seriesPart: 1
---

This is the first of a few posts about work I did at [Nomod](https://nomod.com), where I've been building the payments front end. Nomod lets a merchant take card payments on their phone, no terminal, no hardware. The kind of thing a market stall or a freelancer can open and start charging a card with in a couple of minutes.

This one is about the least glamorous problem you can have in payments: staying compliant while you add more and more ways to charge a card. It doesn't sound like much. It turned into one of the bigger pieces of front-end work I did there.

## Why we kept adding payment providers

When I joined, the setup was simple. We had Stripe and Checkout.com, each with their own hosted card form, plus Google Pay and Apple Pay wired up on top. Two providers, done.

The thing is, every provider takes a cut of every transaction, and the cut isn't the same everywhere. Different providers give you different rates, and you can negotiate different deals depending on region, volume, card type, all of it. So the more providers we could plug in, the more room we had to route a payment through whoever was cheapest for that particular charge.

There was a second reason, and it mattered just as much. If you only have one or two providers and one of them goes down, you're stuck. Adding more gave us somewhere to route to when a provider had an outage. Cheaper on a good day, resilient on a bad one.

So we started adding them. MyFatoorah first, which had genuinely great rates, then Noon, AFS, Adyen, MBME. Each one was another option in the pot. (MyFatoorah we eventually moved off. The rates were the best we had at first, but they came back wanting to renegotiate to something far higher, and between the new numbers and the complications that came with it, the deal stopped being the deal we signed up for. Which is its own small lesson: the best rate today isn't the same thing as a deal you can count on.)

## The problem nobody sees until it's a problem

Here's where it got awkward.

Quick background first, because this is the whole game. PCI DSS is the security standard that covers anyone who handles card data, and the important part is that your compliance burden scales with how much of that data actually flows through your systems. Touch raw card numbers yourself and you're in the deep end: the serious audits, the long questionnaire, real obligations. Never let a raw card number near your servers and you fall into the lightest tier, where a compliant provider handles the sensitive bit and all you have to prove is that you handed it off cleanly and never held it. That lightest tier is exactly where you want to be, and it's where Stripe and Checkout had us to start with.

Stripe and Checkout both hand you a proper hosted card form. Their SDK renders the fields, the raw card number never touches your servers, they tokenize it inside their own vault. That's the whole point of using them: you stay out of PCI scope because you never actually hold card data.

The new providers didn't all work that way. For MyFatoorah in particular, we ended up collecting the card number, CVC and expiry with our own fields. Which means the raw card details were passing through our front end. And the moment that's true, you are in PCI scope, and we weren't set up to be.

So we'd solved the cost-and-resilience problem and quietly created a compliance one. Every provider we added to save money was another card form we controlled, and the more of those we had, the further out of scope we drifted.

We needed a way to keep adding providers without ever touching raw card data ourselves.

## The plan: one form, and let someone else hold the card

The answer we landed on was [Basis Theory](https://basistheory.com). The idea is that they own the tokenization. The card fields live inside their elements, the raw data goes straight to them, and we get back a token. We never see the number.

But the part I actually cared about was this: we could build **one** card form, and use it for every provider. Stripe, Checkout, Noon, AFS, Adyen, MBME, whatever came next. Same form, same fields, same code. Basis Theory tokenizes the card, and the backend decides which provider that token gets sent to. The front end stops caring who's processing the payment.

That was the goal. One dynamic form, out of PCI scope for good, and no dependence on any single provider's proprietary SDK just to collect a card.

## How it actually worked

A few things made this clean rather than a pile of special cases.

We used Basis Theory's **token intents** rather than storing tokens long-term. We didn't want them holding card data any longer than a single payment needed, partly for safety and partly because storing tokens indefinitely costs money we had no reason to spend. Short-lived by default, gone after the charge.

On the front end we loaded their React elements and styled them as our own, so it looks like a Nomod form, not a bolted-on third-party widget. Then I built a set of custom hooks around it to pull the state out of those fields, handle validation and error messages and the usual dirty-and-refresh edge cases, and call the tokenization endpoint to turn the card into a token.

The important part is what happened next. The front end doesn't decide anything about routing. When it's time to pay, it asks the backend, and the backend returns a config that says which service to use for this charge. The front end just reads that config, renders the one form, and on submit sends the token plus whatever the config told it, back to the backend to process. If a provider is down, the backend hands back a different config and the front end doesn't even notice. It's completely decoupled. The backend is the brain, the front end renders a form and does what it's told.

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
    <text x="266" y="60" font-size="12" fill="var(--muted)">the raw card goes straight here.</text>
    <text x="266" y="80" font-size="12" fill="var(--muted)">it never touches our servers.</text>
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
    <text x="632" y="306" font-size="11" fill="var(--muted)">charge</text>
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
  <figcaption>The high-level shape of it. The card goes straight to Basis Theory for a token, so it never touches our servers. The front end just renders one form and sends the token plus whatever provider the backend's config told it to use.</figcaption>
</figure>

## Migrating everything over, one provider at a time

This wasn't a rewrite we shipped in one go. It was a long, careful migration, done in phases, one provider per release so we could test each in production before moving on.

We went in this order:

1. **The card forms first**, starting with MBME, since those were the ones actually out of scope and the whole reason we were doing this.
2. **Then Checkout**, moving it off its own hosted form and onto the shared Basis Theory one.
3. **Then Stripe**, same move.

That last step is worth pausing on, because Stripe and Checkout didn't *have* to move. They were already compliant on their own SDKs. We migrated them anyway, onto the same shared form as everyone else. The reason was consistency. Once every provider went through one form, we could delete a huge amount of duplicated form code, styling, validation and state handling that existed once per provider. One form to maintain instead of six. The front end got noticeably smaller and simpler, and every provider behaved the same way.

(The wallets, Apple Pay and Google Pay, were the final phase, and they were their own kind of tangle because the wallet buttons were coupled to the underlying service. That decoupling is a whole story on its own, so I'm saving it for the architecture post.)

## The parts that didn't fit the happy path

Not everything collapses neatly into "tokenize and send." Some providers need to run their own flow after the card is captured. 3DS is the obvious one, and it applied across every provider, not just one. A few providers also needed their own SDK for a step or two.

The way we kept that from leaking back into the core form: the post-tokenization flow was handled separately from the capture. The shared form's only job is to turn a card into a token. What happens after, whether that's a 3DS challenge, a redirect, an iframe, or a provider's own SDK, was handled by common logic that branched on the service. Most of the provider SDKs could be loaded in an iframe, so they shared one path anyway. That kept the core Basis Theory form completely untouched as the after-steps varied. (This branching handler is really part of the architecture story, so I'll go deeper on it in that post.)

## What we got out of it

The payoff is the boring, good kind. Adding a new provider became almost a non-event on the front end. No new form, no new styling, no new validation. The backend adds the service to its config, and the existing form just works. The front end genuinely didn't need to change.

I want to be honest about the split of work, though. The front end was the smaller half of this. The real weight was on the backend, routing, provider integrations, the config that drove everything, and this was a lot of close back-and-forth with the backend lead and the backend engineers, service by service. The front end still needed real thought up front, because the first time you set the architecture you have to get it right, and after that new providers slot in cheaply. But most of the visible cleverness lived on their side, not mine.

## What I'd do differently

Honestly, not much about the shape of it. The one form was the right call and it aged well.

If anything, I'd have pushed harder, earlier, to move Stripe and Checkout onto the shared form instead of leaving them on their own SDKs for as long as we did. We tolerated the duplication longer than we needed to because those two were already compliant, so there was no urgency. But the duplication was a quiet tax the whole time, and the migration was easier than we'd feared once we actually did it. The lesson I keep relearning: "it already works" is not the same as "it's worth keeping."