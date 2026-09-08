---
title: Knowing when a 3DS payment finished, by polling
publishedAt: "2026-07-14"
summary: 3D Secure runs inside an iframe that won't call you back, so we couldn't actually know when a payment had finished. This is the polling hook we built to find out, which started as one small function and turned into the most deceptively hard thing I shipped at Nomod.
published: true
showHeroImage: true
heroImage: /images/blogs/hero/charge-polling.webp
heroAlt: A cartoon family asking “Are we there yet?” over and over on a road trip
---

This is the third post about payments work at [Nomod](https://nomod.com). The first was about tokenizing cards with Basis Theory, the second about making the frontend read a backend config instead of deciding things itself. Both of those mentioned, in passing, a couple of things that stayed provider-specific and got pushed to the edges. This is one of them, and it's the one that looked trivial and absolutely was not.

It's a polling hook. On the surface it just asks the server "is this charge done yet?" on a loop. That's genuinely all it does. The reason it took real work is everything around the loop.

## Why poll at all

Most card payments have to pass through 3D Secure, the "confirm it's really you" step your bank throws up mid-payment. The provider hands you a URL for that challenge, and you have to show it to the user somehow.

The obvious way is to redirect the whole page to it. That works, but it's a rough experience: the user leaves your checkout, lands on a bank page, and gets bounced back, and on the way you've lost your page state. So for the providers that allowed it, we loaded the 3DS challenge in an iframe instead, right there in the checkout, so the user never actually leaves.

That's where the problem starts. A 3DS iframe is on the bank's domain, not ours, so it's cross-origin, and a cross-origin iframe will not talk to you. It can't tell you the user passed, or failed, or just closed the tab in frustration. From the parent page you are completely blind to what's happening inside it.

<figure>
  <svg viewBox="0 0 680 250" role="img" aria-label="Why we poll: the 3DS iframe is cross-origin and opaque, so it gives our checkout page no callback. The provider reports the outcome to our backend instead, so the checkout polls the backend for the charge status." xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;font-family:inherit">
    <defs>
      <marker id="why-ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="var(--muted)" /></marker>
    </defs>
    <rect x="60" y="40" width="210" height="60" rx="10" fill="var(--chip-bg)" stroke="var(--border)" />
    <text x="165" y="68" text-anchor="middle" font-size="13.5" font-weight="600" fill="var(--text)">3DS iframe</text>
    <text x="165" y="87" text-anchor="middle" font-size="11.5" fill="var(--muted)">cross-origin, opaque</text>
    <rect x="60" y="170" width="210" height="60" rx="10" fill="var(--chip-bg)" stroke="var(--text)" stroke-width="1.4" />
    <text x="165" y="198" text-anchor="middle" font-size="13.5" font-weight="600" fill="var(--text)">our checkout page</text>
    <text x="165" y="217" text-anchor="middle" font-size="11.5" fill="var(--muted)">can't see inside</text>
    <rect x="410" y="40" width="210" height="52" rx="10" fill="var(--chip-bg)" stroke="var(--border)" />
    <text x="515" y="64" text-anchor="middle" font-size="13.5" font-weight="600" fill="var(--text)">the provider</text>
    <text x="515" y="82" text-anchor="middle" font-size="11.5" fill="var(--muted)">reports the outcome</text>
    <rect x="410" y="150" width="210" height="60" rx="10" fill="var(--chip-bg)" stroke="var(--border)" />
    <text x="515" y="178" text-anchor="middle" font-size="13.5" font-weight="600" fill="var(--text)">our backend</text>
    <text x="515" y="197" text-anchor="middle" font-size="11.5" fill="var(--muted)">knows the real status</text>
    <line x1="165" y1="100" x2="165" y2="170" stroke="var(--muted)" stroke-width="1.3" stroke-dasharray="5 4" />
    <g class="dchip" style="--h:5"><rect x="182" y="121" width="120" height="28" rx="8" /><text x="242" y="140" text-anchor="middle" font-size="11.5">no callback</text></g>
    <line x1="515" y1="92" x2="515" y2="150" stroke="var(--muted)" stroke-width="1.3" marker-end="url(#why-ar)" />
    <line x1="272" y1="192" x2="408" y2="172" stroke="var(--muted)" stroke-width="1.3" marker-end="url(#why-ar)" />
    <text x="340" y="166" text-anchor="middle" font-size="11" fill="var(--muted)">poll for status</text>
  </svg>
  <figcaption>The 3DS challenge runs in a cross-origin iframe that can't call back into our page, so we can't tell when the user finishes. The provider reports the outcome to our backend, so we poll the backend for the charge status instead.</figcaption>
</figure>

So we ask the only thing that does know: our own backend. Once the charge exists, its status is the source of truth, and it moves from pending to `paid` or `authorised` or `failed` as the 3DS challenge resolves. We just have to keep asking for it until it settles. That's the whole idea. The nice part is that it's completely provider-agnostic, because the backend normalises every provider's outcome into the same handful of statuses. The polling doesn't know or care who processed the charge.

<figure>
  <svg viewBox="0 0 680 320" role="img" aria-label="Polling lifecycle: start polling, or the user closing the 3DS iframe, both feed the poll-charge-status loop, which runs every second then every three seconds. A paid or authorised status ends in success, a failed status ends in error, and a pending status keeps looping." xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;font-family:inherit">
    <defs>
      <marker id="poll-ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="var(--muted)" /></marker>
    </defs>
    <rect x="40" y="44" width="172" height="50" rx="10" fill="var(--chip-bg)" stroke="var(--border)" />
    <text x="126" y="68" text-anchor="middle" font-size="13.5" font-weight="600" fill="var(--text)">closes 3DS iframe</text>
    <text x="126" y="86" text-anchor="middle" font-size="11.5" fill="var(--muted)">user cancels</text>
    <rect x="280" y="44" width="160" height="50" rx="10" fill="var(--chip-bg)" stroke="var(--text)" stroke-width="1.4" />
    <text x="360" y="68" text-anchor="middle" font-size="13.5" font-weight="600" fill="var(--text)">start polling</text>
    <text x="360" y="86" text-anchor="middle" font-size="11.5" fill="var(--muted)">id + callbacks</text>
    <rect x="266" y="136" width="188" height="54" rx="10" fill="var(--chip-bg)" stroke="var(--border)" />
    <text x="360" y="160" text-anchor="middle" font-size="13.5" font-weight="600" fill="var(--text)">poll charge status</text>
    <text x="360" y="178" text-anchor="middle" font-size="11.5" fill="var(--muted)">every 1s, then 3s</text>
    <g class="dchip" style="--h:145"><rect x="70" y="250" width="172" height="52" rx="10" /><text x="156" y="274" text-anchor="middle" font-size="13.5" font-weight="600">success</text><text x="156" y="291" text-anchor="middle" font-size="11.5">paid or authorised</text></g>
    <g class="dchip" style="--h:5"><rect x="458" y="250" width="172" height="52" rx="10" /><text x="544" y="274" text-anchor="middle" font-size="13.5" font-weight="600">on error</text><text x="544" y="291" text-anchor="middle" font-size="11.5">charge failed</text></g>
    <line x1="360" y1="94" x2="360" y2="134" stroke="var(--muted)" stroke-width="1.3" marker-end="url(#poll-ar)" />
    <path d="M126 94 L126 164 L263 164" fill="none" stroke="var(--muted)" stroke-width="1.3" marker-end="url(#poll-ar)" />
    <text x="150" y="157" text-anchor="start" font-size="11" fill="var(--muted)">stops the loop</text>
    <path d="M454 152 L500 152 L500 120 L457 134" fill="none" stroke="var(--muted)" stroke-width="1.3" marker-end="url(#poll-ar)" />
    <text x="506" y="140" text-anchor="start" font-size="11" fill="var(--muted)">pending</text>
    <line x1="322" y1="190" x2="177" y2="248" stroke="var(--muted)" stroke-width="1.3" marker-end="url(#poll-ar)" />
    <text x="226" y="214" text-anchor="middle" font-size="11" fill="var(--muted)">paid</text>
    <line x1="398" y1="190" x2="541" y2="248" stroke="var(--muted)" stroke-width="1.3" marker-end="url(#poll-ar)" />
    <text x="486" y="214" text-anchor="middle" font-size="11" fill="var(--muted)">failed</text>
  </svg>
  <figcaption>The polling lifecycle. Start it with a charge id and two callbacks, poll the charge status on an interval that eases off from one second to three, and finish on success or failure. A pending status just loops; closing the 3DS iframe stops it.</figcaption>
</figure>

## It started as one function

With two providers, this was nothing. Kick off the charge, call the charge endpoint a few times until the status changed, done. No retries, no backing off, no real lifecycle. It fit in a few lines and it was fine, because "fine" was all it needed to be.

The trouble, like most of this series, arrived with more providers. That little bit of polling logic got copy-pasted into every provider's form and into the wallet flows, because they all needed it. So the first real motivation wasn't sophistication, it was just that the same code was smeared across the codebase and someone was going to change it in one place and forget the other five.

So I went to pull it into one shared utility. That's when the "simple" part fell apart, because once you centralise it you have to actually handle all the cases the copies quietly ignored.

## What it actually had to handle

The requirements piled up fast:

- **Keep going until it's really settled.** Poll until the status is terminal (`paid` or `authorised` means success, `failed` means failure), and treat everything else as "not yet, ask again."
- **Don't hammer the endpoint.** Poll too eagerly and you get rate-limited. So it starts at a one-second interval and backs off to three seconds once it's clear this isn't resolving quickly.
- **Stop cleanly when the user bails.** If someone closes the 3DS popup without finishing, the poll has to stop then and there. Leave it running and you've got a timer quietly hitting your API forever.
- **Fire the right callback.** Whoever started the poll gets told exactly once, success or failure, and never both.
- **Never run two at once.** Only one poll can be in flight across the whole app, or you're doubling your requests and racing two sets of callbacks against each other.

None of these is hard on its own. The difficulty is that they all have to be true at the same time, in a thing that's shared by every payment path in the product.

## The shape it took

It ended up as a context provider mounted once at the root of the app, holding a single piece of mutable state, and exposing an API small enough that there's almost nothing to get wrong at the call site:

```ts
interface ChargePollingResult {
  startPolling: (
    chargeId: string,
    onSuccess: (charge: ChargeT) => void,
    onError: (charge: ChargeT) => void
  ) => Promise<void>;
  stopPolling: () => void;
}
```

That's the whole thing. No config object, no options, no wiring. You call `startPolling` with a charge id and two callbacks, and you call `stopPolling` when the user walks away. Everything else, the interval, the backing off, the request counting, the cancellation, lives inside and never leaks out. Getting the surface this small was most of the point. The call sites are payment forms and wallet buttons that already have enough going on.

Because it's one provider mounted once, there is exactly one polling state in the entire app. It lives in a ref rather than component state on purpose, because I'm mutating it on every tick and I don't want a re-render each time, I just want a stable box I can read and write. Starting a new poll while one is already running stops the old one first, so "only one at a time" is enforced by construction rather than by hoping.

## The details that were the actual work

The interesting parts are all in the loop's edges.

**Cancellation, and keeping the right handle to cancel with.** When the poll starts, it stashes the interval's id in that shared ref. `stopPolling` reads the same id back and clears exactly that interval, then resets the state. This sounds obvious until you realise the whole thing only works if the reference survives from where polling began to wherever it gets cancelled. Closing the 3DS popup calls `stopPolling`, and it just works, because both sides are looking at the same box. Lose that handle and you've leaked a timer that polls the API until the tab closes.

**Not letting requests stack up.** Each tick checks whether the previous request is still in flight before firing another. If the network is slow, ticks skip rather than pile a queue of overlapping requests on top of each other.

**Backing off, and the ceiling.** The pacing is deliberately coarse. It runs at one second, and after ten tries without a terminal status, or after any failed request, it drops to three seconds. It's a single step down, not a smooth exponential curve, and honestly that was enough for what we needed. On top of that there's a hard cap on total requests, so a charge that never resolves eventually gives up instead of polling into eternity.

```ts
const POLLING_INTERVALS = { SHORT: 1000, LONG: 3000 };
const POLLING_LIMITS = {
  MAX_REQUESTS_BEFORE_THROTTLE: 10,
  MAX_TOTAL_REQUESTS: 3600,
};
```

**A small piece of paranoia I'm fond of.** On failure, the error callback is deferred by a tick rather than fired straight away, so the 3DS overlay can unmount before any error UI paints underneath it. Without it you get an ugly flash of the error showing through the closing popup. It's one line and it's the kind of thing you only add after seeing it happen.

## What I'd do differently

I'll be honest: I think it could be simpler, and I tried to make it so more than once. Every time, some requirement pulled it back. It's the sort of utility that reads as over-engineered until you list everything it's quietly holding together, and then it reads as about right.

If I rebuilt it today I'd probably model the lifecycle more explicitly as a small state machine, idle to polling to settled, instead of a set of booleans on a ref. That would make the impossible states actually impossible rather than merely avoided. But I also don't want to oversell that, because the version that shipped is still running in production, it's the most-used utility in the checkout, and it has held up. Sometimes the honest verdict is that the pragmatic thing was good enough, and the elegant rewrite is a nice idea you never quite need.
