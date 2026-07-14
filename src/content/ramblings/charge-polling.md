---
title: Knowing a payment finished when nothing would tell us
publishedAt: "2026-07-14"
summary: 3D Secure runs inside an iframe that won't call you back, so we couldn't actually know when a payment had finished. This is the polling hook we built to find out, which started as one small function and turned into the most deceptively hard thing I shipped at Nomod.
tags: ["Nomod", "Payments", "Frontend", "React", "3DS"]
published: true
series: "nomod-payments"
seriesPart: 3
---

This is the third post about payments work at [Nomod](https://nomod.com). The first was about tokenizing cards with Basis Theory, the second about making the frontend read a backend config instead of deciding things itself. Both of those mentioned, in passing, a couple of things that stayed provider-specific and got pushed to the edges. This is one of them, and it's the one that looked trivial and absolutely was not.

It's a polling hook. On the surface it just asks the server "is this charge done yet?" on a loop. That's genuinely all it does. The reason it took real work is everything around the loop.

## Why poll at all

Most card payments have to pass through 3D Secure, the "confirm it's really you" step your bank throws up mid-payment. The provider hands you a URL for that challenge, and you have to show it to the user somehow.

The obvious way is to redirect the whole page to it. That works, but it's a rough experience: the user leaves your checkout, lands on a bank page, and gets bounced back, and on the way you've lost your page state. So for the providers that allowed it, we loaded the 3DS challenge in an iframe instead, right there in the checkout, so the user never actually leaves.

That's where the problem starts. A 3DS iframe is on the bank's domain, not ours, so it's cross-origin, and a cross-origin iframe will not talk to you. It can't tell you the user passed, or failed, or just closed the tab in frustration. From the parent page you are completely blind to what's happening inside it.

So we ask the only thing that does know: our own backend. Once the charge exists, its status is the source of truth, and it moves from pending to `paid` or `authorised` or `failed` as the 3DS challenge resolves. We just have to keep asking for it until it settles. That's the whole idea. The nice part is that it's completely provider-agnostic, because the backend normalises every provider's outcome into the same handful of statuses. The polling doesn't know or care who processed the charge.

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
