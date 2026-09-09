---
title: Making the frontend dumb on purpose
publishedAt: "2026-07-14"
summary: When I joined Nomod's web team, the checkout was a tangle of per-provider forms and six copies of Apple Pay. Here's how we made the backend config the source of truth, collapsed the mess, and accidentally unlocked dynamic routing.
published: false
showHeroImage: true
heroImage: /images/blogs/hero/config-driven-checkout.webp
heroAlt: A Formula 1 driver captioned “Ahhh... I am stupid” after a mistake
---

This is the second post about payments work at [Nomod](https://nomod.com). The first was about getting out of PCI scope with Basis Theory. This one is the groundwork that made that migration easy, even though I built it before Basis Theory was on the table. It's the less glamorous half of the story: taking a checkout that had quietly turned into a mess and making it boring again.

If the first post was about who holds the card, this one is about who decides how a payment gets made. The answer we landed on was: not the frontend.

## The mess I walked into

When I joined the web team, the checkout worked, but only if you didn't look too closely.

It started simple, which is usually how these things start. There were two providers. Dollar links and invoices went through Stripe, dirhams and riyals went through Checkout. Stripe ran on its own SDK, Checkout on its iframe-based elements, and Apple Pay and Google Pay were wired straight into whichever provider you happened to be using. There was no dynamic routing and no real backend control. A currency implied a provider, and the frontend just knew that, in code.

Two providers is easy. The trouble started when we added more.

By the time I moved over from the mobile app, MyFatoorah was in the mix, and the shape that worked for two providers was buckling. There was one enormous file whose whole job was to figure out, for a given charge, which provider Apple Pay and Google Pay should run through. It was wired directly into the form component, so the form was doing a dozen things it had no business doing. We had three separate card forms, one for Checkout, one for Stripe, one for MyFatoorah, each collecting a card its own way: Stripe's SDK, Checkout's frames, MyFatoorah's custom fields. And because the wallets were coupled to the provider, we didn't have one Apple Pay and one Google Pay. We had six. A Stripe Apple Pay, a Checkout Apple Pay, a MyFatoorah Apple Pay, and the same three again for Google Pay.

The result was code almost nobody could hold in their head. You couldn't easily tell which provider a given charge would use, which wallet scripts were being loaded, or why. It leaked bugs. It was brutal to onboard onto. I'd built up an intuition for it after long enough in the codebase, and even I got tripped up. And the thing that really broke it was anything dynamic: if we wanted one specific charge to run Apple Pay through MyFatoorah instead of the usual, that condition lived on the frontend, tangled in with everything else, and debugging it was miserable.

That was the first thing I flagged when I joined the team, and the first thing I took on.

## The one idea: let the backend decide

Here's the part that stung a little. The backend already had a config that said, per charge, which service to use. The information we needed existed. The frontend just wasn't trusting it. Instead of reading the config and doing what it said, the frontend ran its own explicit conditions, its own assumptions about which currency meant which provider.

So the whole refactor rests on one idea: make the backend config the single source of truth, and have the frontend assume nothing. No currency-to-provider mapping in code. No guessing. The backend says which service handles the card, which handles Apple Pay, and which handles Google Pay, and the frontend's only job is to read that and render it.

I took the proposal to the CTO and two other engineers, we agreed on the shape, and then it was a matter of pulling the pieces apart one at a time.

## Getting state under control

The first blocker was mundane: we didn't really have state management. Early on the product was simple enough that shared global state and a bit of prop drilling was genuinely the right call, no need for a library. But we were well past that now. The config needed to be read all over the tree, and threading it down through layers of props was making everything fragile.

So we brought in Redux Toolkit. The point wasn't Redux for its own sake, it was having one place to put the config the moment a link loaded, so any component that needed to know which service to use could just reach for it instead of having it drilled down ten levels. Designing the slices, and being honest about what was actually global state versus what belonged locally, took some care. But once it was there, everything after it got easier.

## Breaking the monolith

With the config in the store, the giant form component could stop being giant.

We didn't have Basis Theory yet, so I couldn't collapse everything into one form. The card fields genuinely differed per provider. So the move was a wrapper: one component that reads the config, sees which service this charge runs on, and renders the matching form, Checkout or Stripe or MyFatoorah. The forms stayed separate, because they had to be, but the decision about which one to show moved out of a tangle of conditions and into a single boring switch driven by the config.

Separate forms didn't have to mean duplicated forms, though. The three had a lot in common, so I pulled the shared parts out: reusable field components, hooks, and the small utilities that format things like the card number and expiry as you type. Underneath, all three sat on one base form. Each provider's form was really that base plus the bits that were genuinely provider-specific, mostly loading and wiring up its own SDK. So "three forms" was a lot less code than it sounds, and a fix to the shared behaviour landed in all three at once.

I did think about going further. Instead of three forms sharing a base, I could have built a single generic form and wrapped it in a provider that loaded the right SDK and unlocked the provider-specific behaviour, the adapter pattern, more or less. I chose not to, deliberately. Basis Theory was already on the horizon, and once we moved to it this whole problem disappears: one form, no per-provider SDKs to adapt around. Building the more elegant version of a thing I already knew we'd sunset felt like exactly the wrong place to spend time. The base-form approach was cheaper, good enough, and threw nothing away that mattered once the migration came.

## The hard part: one Apple Pay, one Google Pay

The wallets were the real work.

Six implementations had to become two: one Apple Pay component, one Google Pay component, each generic enough to work for any provider. The trick was making the component itself dumb. It loads the wallet button script, sets up the button and the UI, and renders it. Everything provider-specific, what actually happens when someone taps that button, comes in as props and callbacks. The component doesn't know or care who's processing the payment. It raises the events, and whatever was passed in deals with them.

This was the piece we sweated over. Apple Pay and Google Pay were among the highest sources of revenue we had, easily the most-used way people paid, so getting this wrong wasn't a styling bug, it was money. It took the most back-and-forth and the most testing of anything in the refactor. But it collapsed the single messiest part of the checkout into two components you could actually reason about.

## Only load what you use

One quiet win fell out of all this. Before, because everything was coupled, we were loading scripts we never used. Even on a Stripe charge we'd pull in Checkout's frames, which then just sat there, loaded and unrendered. Once the config told us exactly which services a charge needed, we could load only those. A Stripe card form with Stripe wallets loads Stripe and nothing else. A charge that wanted its card form on one provider and Google Pay on another loads exactly those two. Lighter, and far easier to follow.

<figure>
  <svg viewBox="0 0 760 560" role="img" aria-label="Before and after diagram. Before: one form component drives three coupled per-provider forms, each with its own Apple Pay and Google Pay, six wallet implementations in total. After: when a link loads, the config is stored, and three independent lanes for card form, Apple Pay and Google Pay each read their own service from the config." xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;font-family:inherit">
    <defs>
      <marker id="a2-ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="var(--muted)" /></marker>
    </defs>
    <text x="24" y="30" font-size="11.5" font-weight="700" fill="var(--muted)" letter-spacing="0.08em">BEFORE</text>
    <rect x="270" y="44" width="220" height="46" rx="10" fill="var(--chip-bg)" stroke="var(--text)" stroke-width="1.6" />
    <text x="380" y="72" text-anchor="middle" font-size="13.5" font-weight="600" fill="var(--text)">one form component</text>
    <line x1="365" y1="92" x2="150" y2="148" stroke="var(--muted)" stroke-width="1.2" marker-end="url(#a2-ar)" />
    <line x1="380" y1="92" x2="380" y2="148" stroke="var(--muted)" stroke-width="1.2" marker-end="url(#a2-ar)" />
    <line x1="395" y1="92" x2="610" y2="148" stroke="var(--muted)" stroke-width="1.2" marker-end="url(#a2-ar)" />
    <rect x="40" y="150" width="200" height="58" rx="10" fill="var(--chip-bg)" stroke="var(--border)" />
    <text x="140" y="178" text-anchor="middle" font-size="13" font-weight="600" fill="var(--text)">Stripe</text>
    <text x="140" y="197" text-anchor="middle" font-size="10.5" fill="var(--muted)">form · Apple Pay · Google Pay</text>
    <rect x="280" y="150" width="200" height="58" rx="10" fill="var(--chip-bg)" stroke="var(--border)" />
    <text x="380" y="178" text-anchor="middle" font-size="13" font-weight="600" fill="var(--text)">Checkout</text>
    <text x="380" y="197" text-anchor="middle" font-size="10.5" fill="var(--muted)">form · Apple Pay · Google Pay</text>
    <rect x="520" y="150" width="200" height="58" rx="10" fill="var(--chip-bg)" stroke="var(--border)" />
    <text x="620" y="178" text-anchor="middle" font-size="13" font-weight="600" fill="var(--text)">MyFatoorah</text>
    <text x="620" y="197" text-anchor="middle" font-size="10.5" fill="var(--muted)">form · Apple Pay · Google Pay</text>
    <text x="380" y="242" text-anchor="middle" font-size="11" fill="var(--muted)">one component decided everything, hard-coded per provider, six copies of the wallet buttons.</text>
    <line x1="40" y1="278" x2="720" y2="278" stroke="var(--border)" stroke-width="1" />
    <text x="24" y="312" font-size="11.5" font-weight="700" fill="var(--muted)" letter-spacing="0.08em">AFTER</text>
    <text x="380" y="330" text-anchor="middle" font-size="10.5" fill="var(--muted)">when a link loads</text>
    <rect x="260" y="340" width="240" height="52" rx="10" fill="var(--chip-bg)" stroke="var(--text)" stroke-width="1.6" />
    <text x="380" y="366" text-anchor="middle" font-size="13.5" font-weight="600" fill="var(--text)">config in the store</text>
    <text x="380" y="383" text-anchor="middle" font-size="10.5" fill="var(--muted)">the backend's source of truth</text>
    <line x1="380" y1="392" x2="140" y2="432" stroke="var(--muted)" stroke-width="1.2" marker-end="url(#a2-ar)" />
    <line x1="380" y1="392" x2="380" y2="432" stroke="var(--muted)" stroke-width="1.2" marker-end="url(#a2-ar)" />
    <line x1="380" y1="392" x2="620" y2="432" stroke="var(--muted)" stroke-width="1.2" marker-end="url(#a2-ar)" />
    <rect x="40" y="434" width="200" height="64" rx="10" fill="var(--chip-bg)" stroke="var(--border)" />
    <text x="140" y="463" text-anchor="middle" font-size="13" font-weight="600" fill="var(--text)">Card form</text>
    <text x="140" y="482" text-anchor="middle" font-size="10.5" fill="var(--muted)">the service the config says</text>
    <rect x="280" y="434" width="200" height="64" rx="10" fill="var(--chip-bg)" stroke="var(--border)" />
    <text x="380" y="463" text-anchor="middle" font-size="13" font-weight="600" fill="var(--text)">Apple Pay</text>
    <text x="380" y="482" text-anchor="middle" font-size="10.5" fill="var(--muted)">the service the config says</text>
    <rect x="520" y="434" width="200" height="64" rx="10" fill="var(--chip-bg)" stroke="var(--border)" />
    <text x="620" y="463" text-anchor="middle" font-size="13" font-weight="600" fill="var(--text)">Google Pay</text>
    <text x="620" y="482" text-anchor="middle" font-size="10.5" fill="var(--muted)">the service the config says</text>
    <text x="380" y="530" text-anchor="middle" font-size="11" fill="var(--muted)">each lane reads its own service, any combination works, and we load only the scripts we're told to.</text>
  </svg>
  <figcaption>Before, one component made every decision and the wallets were copied per provider. After, the backend config decides each piece on its own, and the frontend just renders what it's told.</figcaption>
</figure>

## What it unlocked

None of this was the goal in itself. The goal was to stop the bleeding. But making the frontend dumb turned out to unlock two things I care about more than the cleanup.

The first is the Basis Theory migration from the last post. It went smoothly because this refactor had already drawn clean lines between the services. Each provider was its own form behind a wrapper, each wallet flow was already decoupled, so swapping a provider's form for the shared Basis Theory one was almost mechanical. We migrated them one at a time and then quietly sunset the custom Checkout, Stripe and MyFatoorah forms in favour of the single form. The wallets were already generic, so they came along for free. The hard architectural thinking had happened here, first.

The second is dynamic routing, and it's my favourite side effect. Because the frontend no longer assumed any relationship between a currency and a provider, the backend was free to change its mind. If a charge failed with one provider, the backend could hand back a different service, and we'd simply retry with it, passing that new service straight back as the payload. The frontend didn't need to understand why. To make that work across an intentionally auth-less links platform, where a payment link is just a URL you open and pay, no login, because logging in would wreck the UX, we leaned on cookies so the backend could tell that the same link had already failed on another provider. That routing became the backbone of our resilience: retries when a charge failed, somewhere to fall back to when a provider went down. With the old architecture, I don't think it would have been possible.

<figure>
  <svg viewBox="0 0 680 240" role="img" aria-label="Dynamic routing on a failed charge: an attempt on provider A fails, the backend reroutes to provider B, and the retry succeeds. A cookie remembers the failure across the auth-less payment link." xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;font-family:inherit">
    <defs>
      <marker id="route-ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="var(--muted)" /></marker>
    </defs>
    <rect x="40" y="50" width="170" height="60" rx="10" fill="var(--chip-bg)" stroke="var(--border)" />
    <text x="125" y="78" text-anchor="middle" font-size="14" font-weight="600" fill="var(--text)">provider A</text>
    <text x="125" y="97" text-anchor="middle" font-size="12" fill="var(--muted)">first attempt</text>
    <rect x="255" y="50" width="170" height="60" rx="10" fill="var(--chip-bg)" stroke="var(--text)" stroke-width="1.4" />
    <text x="340" y="78" text-anchor="middle" font-size="14" font-weight="600" fill="var(--text)">backend reroutes</text>
    <text x="340" y="97" text-anchor="middle" font-size="12" fill="var(--muted)">picks another provider</text>
    <rect x="470" y="50" width="170" height="60" rx="10" fill="var(--chip-bg)" stroke="var(--border)" />
    <text x="555" y="78" text-anchor="middle" font-size="14" font-weight="600" fill="var(--text)">provider B</text>
    <text x="555" y="97" text-anchor="middle" font-size="12" fill="var(--muted)">the retry</text>
    <line x1="210" y1="80" x2="252" y2="80" stroke="var(--muted)" stroke-width="1.3" marker-end="url(#route-ar)" />
    <line x1="425" y1="80" x2="467" y2="80" stroke="var(--muted)" stroke-width="1.3" marker-end="url(#route-ar)" />
    <line x1="125" y1="110" x2="125" y2="128" stroke="var(--muted)" stroke-width="1.3" marker-end="url(#route-ar)" />
    <g class="dchip" style="--h:5"><rect x="70" y="131" width="110" height="30" rx="8" /><text x="125" y="150" text-anchor="middle" font-size="12" font-weight="600">fails</text></g>
    <line x1="555" y1="110" x2="555" y2="128" stroke="var(--muted)" stroke-width="1.3" marker-end="url(#route-ar)" />
    <g class="dchip" style="--h:145"><rect x="500" y="131" width="110" height="30" rx="8" /><text x="555" y="150" text-anchor="middle" font-size="12" font-weight="600">succeeds</text></g>
    <line x1="340" y1="110" x2="340" y2="166" stroke="var(--muted)" stroke-width="1.3" stroke-dasharray="5 4" />
    <rect x="255" y="168" width="170" height="50" rx="10" fill="var(--chip-bg)" stroke="var(--border)" />
    <text x="340" y="190" text-anchor="middle" font-size="14" font-weight="600" fill="var(--text)">cookie</text>
    <text x="340" y="208" text-anchor="middle" font-size="12" fill="var(--muted)">remembers the failure</text>
  </svg>
  <figcaption>Because the frontend assumed no fixed provider, a failed charge didn't dead-end. The backend rerouted to another provider, the retry went through, and a cookie remembered the failure across the auth-less link.</figcaption>
</figure>

## The edges that stayed provider-specific

Not everything could be made generic, and I won't pretend it could. A couple of things stayed provider-specific by nature, and we pushed them out to the edges so the core stayed clean.

3DS was one, and I touched on it last time: a small custom hook that works out which 3DS flow to trigger for a given service, kept outside the generic form. The other was polling, which sounds trivial and absolutely was not. Working out when a user has finished a 3DS challenge inside an iframe, across every provider, with retries and throttling and cancellation, turned into the most deceptively hard thing I built there. It's a whole story of its own, and it's next in this series.

## What I'd do differently

The honest answer is I'd have started thinking about this sooner. By the time I proposed it, the mess was already load-bearing. In my defence I was on the mobile app while a lot of it accreted, and only picked it up when I moved to the web team, but still.

The other honest note: this is the thing I'm most glad I pushed for. It was my initiative. I proposed it, got the go-ahead, and built it with two other engineers over a good stretch, in pieces, behind end-to-end and integration tests. We shipped it without, as far as I can remember, a single production incident, which for a change this central to how money moves through the product, I'll take.
