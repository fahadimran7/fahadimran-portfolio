---
title: I really hate updating my résumé. So I built a machine to do it.
publishedAt: "2026-06-17"
summary: A master résumé, a LaTeX template, and a folder full of instructions. A tiny automation for the one task I refuse to do by hand.
published: false
heroImage: "https://images.unsplash.com/photo-1566699270403-3f7e3f340664?auto=format&fit=crop&w=1600&q=82"
heroAlt: A developer's desk almost disappearing under stacks of paper, notes, and old equipment
heroCredit: Wonderlane
heroCreditUrl: "https://unsplash.com/photos/office-table-with-pile-of-papers-6jA6eVsRJ6Q"
---

I hate writing my résumé. Not in a casual, who-doesn't way. In a deep, in-the-bones way.

Every time I open it I have to do the one thing I am worst at: sell myself. List my own wins, tie each one to a role, phrase it all like I planned it from the start. If it were up to me I would let the work speak for itself and never touch a CV again. But that is not how any of this works, especially right now. The job market is rough, getting ghosted is the default outcome, and a résumé that an ATS can't read just gets you ghosted faster than an actual ghost.

So I did what I do with most things I dread. I automated it.

## The before

I kept my résumé in Overleaf. LaTeX formatting beats every drag-and-drop builder, so that part was fine. The problem was the loop: edit the LaTeX, compile, look, repeat. Or ask Claude for changes, paste them in, upload, see the result, go again. Slow. And the free plan has limits, so I was rationing compiles like it was wartime.

The bigger problem was philosophical. I kept cutting different versions for different roles. Some achievements land harder for a payments job, others for a frontend one, so I would snip a bullet here and paste one back there. Overleaf never held the whole me. It only ever held one specific edit of me, and I had to remember which one was which.

## The idea (which I'm stealing from a friend)

A friend handed me the fix over a conversation: a master résumé. One file that holds everything. Every role, every date, every achievement, and the reasoning behind it. The full professional history, uncut. It never shrinks.

You don't tailor the master. You project from it. A tailored résumé becomes a curated cut of that master for one job description: pick the most relevant wins, reorder them into the role's language, drop the rest, and let an agent help fill the gaps. The master stays whole. The output stays sharp.

That was the whole basis for the project.

## The build

LaTeX again, because it is the most flexible thing going and renders straight to PDF. [clean typography, plain-text you can version-control, total control over layout, no surprise reflow, and it's free]

Then I added a few bells and whistles:

- **ATS checks.** After every build it extracts the PDF text the way an applicant tracking system would, and shows me exactly what the robot reads. If my name comes out as "F a h a d" or the columns scramble, I catch it before a recruiter's filter does.
- **A humanizer pass.** Generated résumés get scrubbed of the AI tells. No "leverage," no "seamless," no "robust," no em dashes. If it reads like a language model wrote it, it gets rewritten. I would rather sound like me than like everyone else's chatbot.
- **A references folder.** When I like someone else's résumé, I drop the PDF in and jot down what I liked about it. The instructions pull from those. Good artists borrow, and so do good résumés.

Everything lives in the instruction files. No app, no UI, no account. All the rules sit in a `CLAUDE.md` (or an `AGENTS.md`, if you swing that way), and I can extend them any time. You feed it your own sources. For me that was my LinkedIn export, since it had the most detail, plus a few gaps I filled in by hand. Then you point it at a job description and it generates a résumé tailored to that role, from your actual history.

One rule matters more than the rest: it only uses facts from the master. If a job wants something I haven't done, it tells me about the gap instead of quietly inventing it. The point is a résumé I can stand behind, not fan-fiction about my own career.

## "Couldn't you just build an app?"

Yes. Products already exist for this. Most do the same thing, some bolt on features I don't want, and not all of them are free. This one runs on Claude, or a local model, or whatever agent you like. You need the instruction file and a couple of tools installed, and that's it. It's basically agent-agnostic and lives in a folder I own.

## The part that still gets me

This is a tiny automation. Nothing clever. But pre-AI it would have been real work: the LaTeX tooling, the parsing, the text-extraction checks, the style rules, all of it. Now it's mostly a well-written set of instructions and a small build script. That's the bit that still surprises me. The hard part used to be building the thing. Now the hard part is deciding what you actually want it to do.

What I wanted was simple. To never stare at my own résumé again. To apply to more roles without dreading the prep. To get output that's tailored, ATS-safe, and sourced from my real work instead of AI slop. And to have it follow me to any machine, because it's just a folder.

If it saves me the formatting, the template-wrangling, the ATS anxiety, and the special misery of describing myself in the third person, it's already paid for itself. And when I find another résumé I admire, I drop it in the references folder and the whole thing gets a little smarter.

I might flesh it out with a README so other people can use it. For now it does the one job I needed: it lets me apply to things without having to resume my résumé.
