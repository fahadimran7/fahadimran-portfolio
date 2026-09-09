---
title: I built a zakat calculator in 2026. The code was the easy part.
publishedAt: "2026-06-15"
summary: A boring app, two prompts of working code, and six months of UX questions I couldn't hand off. Why the calculator was the easy part.
published: true
showInlineMedia: true
heroImage: "https://images.unsplash.com/photo-1762265591492-1454ae17f31a?auto=format&fit=crop&w=1600&q=82"
heroAlt: A calculator, paperwork, coins, and prayer beads sharing a desk
heroCredit: Cht Gsml
heroCreditUrl: "https://unsplash.com/photos/desk-with-calculator-papers-and-prayer-beads-MWa1Ui1ZPT4"
---

Let me get the obvious thing out of the way.

I built a zakat calculator. It's one of the most boring, most common kinds of app you can think of. No AI features, no agents, no pipelines, none of the words you'd put on a landing page to make it sound like a startup. And I built it in 2026, when a working version of this is honestly two prompts away in Claude Code. I'm not exaggerating. I could have a functional zakat calculator running in less time than it takes to make chai.

So why bother?

Two reasons. One, it's a problem I actually have. Two, and this is the part I want to talk about, building it well had almost nothing to do with the code.

## It started, like everything does, with a Google Sheet

Every year I pay zakat, and I'm the kind of person who obsesses over tiny, pointless details. I want a record of everything. So I keep a Google Sheet. A very carefully formatted one, with a template I reuse each year.

The routine goes like this. I add every asset by hand, calculate the total with my formulas, then handwrite every single payment as I make it. And when I'm doing that calculation, I have to look up the current gold rate for the gold we own, because that number keeps moving and it changes what the gold is actually worth. On top of mine, I also manage my wife's zakat, so that's a second full set of calculations and payments. One template, lots of tabs.

So one day I thought, why not just make an app for this?

I know. I know exactly how that sounds. Half the apps on the internet started life as someone's spreadsheet and the words "why not an app for this." I cringed at myself a little. But here I am doing the same thing anyway, so, you know. Whatever.

## The one rule I gave myself

If I was going to build it, I didn't want to build just another zakat calculator. The whole point was this: the UX had to be good enough that a normal person, someone who has never wanted anything more than a pen and paper for this, could open it and just get it.

That one rule is basically the whole point. Every hard part of this project came out of it.

For inspiration I had to look outside the category, because inside it there was nothing. The zakat apps on the Play Store look like they're from the nineties. One screen, one calculation, no flows worth learning from. So I looked at apps I actually like instead. [Chris Raroque](https://chrisraroque.com/) makes these productivity apps on YouTube, [Luna](https://lunabudgeting.com/) for budgeting and [Amy](https://www.amyfoodjournal.com/) for food journaling, and the UX is really, really nice. There's also [Quranly](https://www.quranly.app/), an app for building a daily Quran reading habit. Raroque's stuff is mostly iOS. Quranly does both. I use a Pixel, so this was always going to be Android first. No iPhone in the house, and I genuinely can't be bothered with a simulator right now, so Android it is.

## How I actually build this stuff

My way of working is UI first, and a little stubborn about it.

I start by just talking to Claude. I explain the project, then ask for plain HTML files for each screen, one at a time. No Expo, no React, no Android setup, nothing. Just me and a folder of HTML mockups, giving feedback. Each screen went through six, seven, eight rounds before I liked it. Once I had five or six screens I was happy with, I had Claude scaffold the real thing in Expo, set up the Android side, and port the screens over.

Then I build the UI with dummy data, and only the UI. I don't wire in the backend or the data structures or any of the real logic until I'm actually happy with how everything looks and feels. The reason is simple. I nitpick like crazy and I change my mind constantly, and it's way cheaper to throw away a screen than to throw away a screen plus all the code wired behind it. A lot of this was always going to end up in the bin. Better it goes in the bin cheap.

Here's roughly where these screens ended up. All of these started as plain HTML and went through a pile of revisions before they looked like this.

<figure>
  <img src="/images/blogs/building-a-zakat-app/figma-image-1.webp" alt="Home, Assets, and the zakat calculation screens" />
  <figcaption>The home screen with the green hero card, the assets breakdown, and the calculation laid out step by step: your wealth, the nisab check, the 2.5% rate, and what you owe.</figcaption>
</figure>

<figure>
  <img src="/images/blogs/building-a-zakat-app/figma-image-2.webp" alt="Recording a giving: category picker, custom category, and the keypad" />
  <figcaption>Recording a payment. Pick who you're giving to, make your own category if none fit, then the keypad I probably spent too long on.</figcaption>
</figure>

<figure>
  <img src="/images/blogs/building-a-zakat-app/figma-image-3.webp" alt="A few details, the History calendar, and the confirmation screen" />
  <figcaption>The last details, the calendar view of past giving, and the little confirmation moment at the end.</figcaption>
</figure>

So no, I'm not going to pretend this is some breakthrough. It's a simple app. But a lot of things look simple from the outside, and the UX is the part I'll never actually be done with. I could spend another six months on it and still not be happy. That's where all the work went. Not into AI, not into data pipelines, into the small UX questions this "simple" app kept throwing at me.

Here are the ones that actually hurt.

## First, when does the year even start?

Zakat runs on a yearly cycle. You pay it once a lunar year, counting the assets you held across that year. So the very first thing the app has to figure out is your zakat date.

And for a lot of people the honest answer is "no idea." So you can't just drop a date picker in front of them and walk away. The app has to explain. Most people pay in Ramadan, so you can pick a date then, or you can just pick today and start your cycle now. Tiny thing. But without that little explanation, the date picker is just a wall.

## Then, nisab, without making the call for them

Nisab is the threshold. If your wealth, minus what you owe, is above it, you pay zakat. Below it, you don't.

Here's the catch. Nisab can be worked out on gold or on silver, and the two give you pretty different numbers. The silver threshold is lower, which means going with silver pulls more of your wealth into zakat. Some scholars prefer silver for exactly that reason.

This is a real fork, and I could've just quietly defaulted to one. But this is a matter of faith, not a settings toggle, and I didn't want to make that decision for someone. So the app lets you pick, gold or silver or a custom amount, and it's very upfront about what your choice actually means. Pick silver and you'll probably end up paying on a lower threshold. Tell them, don't decide for them.

## Logging a payment without it feeling like a spreadsheet

The core loop is simple. See what you owe, see the breakdown clearly, then pay it off and watch the number go down. You've paid this much, this much is left.

When you give zakat it goes to recipients. The Quran lays out who's eligible, but it does it in broad categories, and some of them aren't obvious to a regular person. There's one that translates to something like "those whose hearts are to be reconciled." Beautiful, but if you're just trying to log a payment, you have no idea what that means or how it maps to what you actually did. So instead of dumping the raw categories on people, I picked sensible everyday buckets that still sit inside the categories the Quran lays out. A person, a mosque, education, health, that kind of thing. You pick one, enter an amount and a note, and it gets logged against what you owe.

The entry screen got more attention than it probably deserved. I had Claude build a custom on-screen keypad with animated digits, so it feels like typing an amount into a banking app. And when you record a payment there's a little confetti moment and a screen that congratulates you on the good deed. This is a religious act, not a phone bill. The app should feel like it knows that.

<figure class="phone">
  <video src="/images/blogs/building-a-zakat-app/zakat-keypad-animation.mp4" poster="/images/blogs/building-a-zakat-app/zakat-keypad-animation.webp" autoplay loop muted playsinline></video>
  <figcaption>The keypad. Yes, I spent way too long on how the digits animate. No, I don't regret it.</figcaption>
</figure>

<figure class="phone">
  <video src="/images/blogs/building-a-zakat-app/zakat-success-confetti.mp4" poster="/images/blogs/building-a-zakat-app/zakat-success-confetti.webp" autoplay loop muted playsinline></video>
  <figcaption>And the bit right after you give. A little confetti, a short prayer, a line from the Quran or hadith. It's a good deed, the app should celebrate it with you.</figcaption>
</figure>

## Then I gave it to my family, and got humbled

The first version worked. The flows were correct. I handed it to my brother, my wife, my mother, my father.

The feedback was pretty consistent, and a little deflating. The app worked great if you already understood zakat. But if you didn't already know the terms, you were a bit lost. It didn't explain enough, it didn't hold your hand. It assumed you walked in already knowing all the words, and most people don't.

<figure>
  <img src="/images/blogs/building-a-zakat-app/notes-after-feedback.webp" alt="My notes from the first round of user testing with family" />
  <figcaption>My actual notes from round one of testing on the family. Bugs and confusions at the top, bigger product gaps in the middle, nice-to-haves at the bottom. Most of it boiled down to the same thing: explain more.</figcaption>
</figure>

So, back to the drawing board. I redid a bunch of screens and added the stuff a first-timer needs. An onboarding flow that walks you through what a zakat year even is, how to pick your date, what to do if you don't have one. Nisab explained right there, gold versus silver, and plainly what each one means for you. Empty states that actually teach, because people were landing on the home screen with no idea what to do, so now it just tells them: add your assets and we'll handle the maths. And a worked example of a zakat calculation, showing you take your wealth, compare it to nisab, and if you're above it, apply the rate. Show the arithmetic instead of hiding it.

<figure class="phone">
  <video src="/images/blogs/building-a-zakat-app/zakat-onboarding-zakat-date.mp4" poster="/images/blogs/building-a-zakat-app/zakat-onboarding-zakat-date.webp" autoplay loop muted playsinline></video>
  <figcaption>The onboarding. Picking your zakat date, with a "which day should I pick?" link right there for anyone who has no idea, because most people don't.</figcaption>
</figure>

None of this is technically interesting at all. All of it was the difference between an app my family could use and one they couldn't.

## Cycles, which nearly broke me

This was the painful one, because a "year" has way more edge cases than it has any right to.

Say my zakat date is the 11th of August. I'm in this year's cycle, paying it down. When the next 11th of August comes round, that old cycle has to close on its own, because you can't keep paying into a year that's already over. So the app closes it out, logs it to history, and tells you straight what happened. Here was your breakdown, here's what you paid, and you were short by this much.

What to actually do with that shortfall, I haven't figured out. Some apps roll it forward into the next year. I'm not sure that's right, so for now I just mark it short and move on.

The other direction is when you pay everything off early. Then you need a way to say "I'm done" before the date arrives. So once you've covered the full amount you get a celebration screen and the option to mark the year complete. It logs, and you start fresh when your next zakat date comes around.

Two different feelings, and I kept them separate on purpose. Finishing your payments is one small moment. Sealing the year is the big one.

## Backfill, where I hand the responsibility back to you

When I move over to this app, I've got years of old zakat records sitting in my spreadsheet that I'd like to bring along, so my history isn't empty on day one. That's all backfill is, letting you add past years into the app after the fact. Sounds easy. It wasn't.

You can't backfill the current year or a future one, because you don't owe zakat for a year that hasn't finished yet. And old entries drag old problems in with them. What was the gold rate that day? The app can't know. So backfill ended up being a thing where I let you enter old payments but had to spell out, clearly, that for old years a lot of the accuracy is on you, not the app. It's the one place I make the user do the heavy lifting, and I tried to be upfront about exactly where and why.

## Sadaqah, and all the states in between

Not everyone owes zakat. If your assets are below nisab you owe nothing, but you might still want to give. That's sadaqah, voluntary charity.

I wanted the app to handle that properly, which meant the home screen needed different states instead of one fixed view. If you're below nisab, you owe no zakat but you can still give sadaqah, and the app explains the difference and roughly when zakat would kick in for you. If you're mid-cycle and partly paid, there's a progress bar toward your goal. Paid off and complete is a different state again.

<figure class="phone">
  <img src="/images/blogs/building-a-zakat-app/zakat-not-owed.webp" alt="Home screen when wealth is below nisab" />
  <figcaption>Below nisab. No zakat owed, but you can still give sadaqah if you want to.</figcaption>
</figure>

<figure class="phone">
  <img src="/images/blogs/building-a-zakat-app/zakat-owed.webp" alt="Home screen with zakat owed and unpaid" />
  <figcaption>Zakat owed, nothing paid yet. The card turns green and shows what's left.</figcaption>
</figure>

<figure class="phone">
  <img src="/images/blogs/building-a-zakat-app/zakat-paid.webp" alt="Zakat complete congratulations sheet" />
  <figcaption>Everything paid. The next time you open the app, this little congrats sheet shows up and nudges you to close out the year.</figcaption>
</figure>

I also made sadaqah something you can give any time, even while you still owe zakat. It just doesn't count against the zakat. A voluntary gift, tracked next to the obligation but never mixed up with it.

## The rates thing, which is the one bit of actual backend work

All those gold and silver sums need a price, and prices move. I can't ask the user to type in today's gold rate every time. So I built a small service that pulls live gold and silver rates from free APIs and shows them in the app, with caching and retries and enough checking that a failed refresh never wipes out a good number.

<figure class="phone">
  <video src="/images/blogs/building-a-zakat-app/zakat-nisab-calculations.mp4" poster="/images/blogs/building-a-zakat-app/zakat-nisab-calculations.webp" autoplay loop muted playsinline></video>
  <figcaption>Live gold and silver rates feeding the nisab calculation, so the threshold is always worked out against today's prices, not a number you had to look up.</figcaption>
</figure>

One local quirk. In Pakistan we weigh gold in tola, while a lot of the world uses grams. So the app supports both and converts between them.

And currencies, well, I took the dumbest possible route on purpose. I don't convert amounts, I just swap the currency symbol. For a private, single-user zakat keeper, real currency conversion is complexity nobody asked for. Simplest thing that's still correct wins.

## The stuff I obsessed over for no good reason

Page swipe animations. The animated digits on the keypad. The little celebrations. Theming, icons, the asset-adding flow, the donation flow. I even built a calendar view that lays your past payments out across the year, for no reason other than I thought it looked cool.

The app icon got the same treatment. My approach was to lean on references. I really like the [Forest app's artwork](https://forestapp.cc/), that little leaf sprouting from the ground, and I wanted something in that spirit, because zakat has the same feeling to it. You plant a seed, you watch it grow. So I gave ChatGPT that reference, wrote a prompt, and it came back with a bunch of designs. A lot of them were honestly atrocious. But one was clearly better than the rest, so I went with that one, and wired it in. I'm still not happy with it, though my wife really likes it, so maybe it's just me.

## What's still missing

Plenty, and I'm saying it plainly because "finished" was never the claim.

There's no Hijri calendar option yet. The app runs on the Gregorian calendar, which is how I personally track mine, but some people work off the Islamic calendar and the app doesn't let you switch. That should be in there.

There's no Ushr, the zakat on crops and livestock, which is calculated at different rates. I don't have that need myself, so I haven't built it.

There's no proper liabilities concept. Right now the app assumes you've already subtracted your debts when you enter your assets. A real version, where you list what you owe and the app does the subtraction for you, is something I've seen done well elsewhere and should add. It matters. It's just not there yet.

And then dark mode, CSV export, which is probably two prompts and maybe one, and a better icon and nicer empty-state art.

It's local-only, by the way. No cloud sync. Everything lives on your device. I could wire up a backend in an afternoon, but people are reasonably nervous about their financial details sitting on someone's server, and come on, it's a zakat keeper. You do not need it synced across sixty devices. Private by default was the obvious choice.

## So why write all this down?

Honestly, because all of this is in my head right now, and if I don't get it down it's just going to dissolve into a chat log and disappear. I'm a bit burned out too. It's kind of funny how much went into something this small.

But that's the thing I keep coming back to. Even a simple app, if you actually want it to be intuitive, if you want it to explain itself to someone who's never touched a tool like this, still takes a huge amount of UX work. Decisions, constraints, testing, going back and redoing things. And I'm not sure that part ever really gets easy, or that you can hand it off any time soon.

Someone said it better than I can. AI can code, but it can't UX. Yet.

The code was two prompts. Everything else was the work.
