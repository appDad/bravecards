# Brave Cards

A phone-first flashcard game for practicing social skills at home: what to say at lunch, at recess, when joining a game, and when it's time to stand up for yourself.

Built with React + Vite + Tailwind + Firebase (Firestore and Hosting). Plain JavaScript.

## How it works

- **Family code.** The app opens on a number pad. Each family has its own code, created on the admin page. A device remembers the code after the first time.
- **Pick a kid.** Big avatar buttons. Each kid has their own points, streak, missions, and trophies.
- **Practice.** Each run deals 10 random cards from the deck. Tap a card to flip it. Swipe right (or tap **Practiced**) for +1 point, swipe left to **Skip**. Pick **Parent** or **Friend** at the top so practice gets counted by who it was with.
- **👎 Hide.** Tap 👎 on a card the kid doesn't like and it never gets dealt to them again (there's an Undo right after). Hidden cards can be brought back in the Trophy Room.
- **Missions.** **Gonna try it with a friend** saves the card to *My missions* on the home screen, so they can warm up before school.
- **I said it for real! +5.** The big celebration. If the card was a mission, the mission is complete.
- **Say it your way.** Long-press the back of a card (or tap the pencil) to rewrite the line in the kid's own words.
- **Grown-ups settings** (bottom of the kid picker). Kids know the family code, so settings ask for math built on it, like *(family code × 37) + 58*: use a calculator and tap the last 2 digits of the answer. The numbers change every time, and 3 wrong answers lock the pad for 60 seconds. Inside, add, edit, or remove kids, and write your own cards. Family cards show up in the decks for every kid in that family.
- **Admin** (link at the bottom of the family code screen). Sign in with Google as egabel@gmail.com to create, rename, and delete family codes.

## Setup (Windows CMD)

Requires Node.js 20+ and the Firebase CLI.

```bat
npm install -g firebase-tools
npm install
copy .env.example .env
```

Fill in `.env` from Firebase console > Project settings > Your apps > Brave Cards (web app) > Config. (On the machine this was built on, `.env` is already filled in.)

### One-time Firebase steps

Already done: project `bravecards`, Firestore database (nam5), web app, security rules, and your family code.

Still needed, in the [Firebase console](https://console.firebase.google.com/project/bravecards/authentication):

1. **Authentication > Get started**
2. **Sign-in method > Google > Enable**, pick your support email, **Save**

This turns on Google sign-in for the admin page. Families never sign in.

## Run locally

```bat
npm run dev
```

Open http://localhost:5173.

To try it on your phone on the same Wi-Fi:

```bat
npm run dev -- --host
```

Then open the "Network" address it prints on your phone.

## Deploy

```bat
firebase login
firebase deploy
```

`firebase deploy` builds the app first, then publishes the site and the Firestore rules. Live at https://bravecards.web.app.

To deploy only one part:

```bat
firebase deploy --only hosting
firebase deploy --only firestore:rules
```

## Adding lots of cards (spreadsheet round-trip)

The built-in cards live in `src/content/cards.json`. The easy way to add many is through a spreadsheet:

```bat
npm run cards:export
```

That writes `cards-export.csv` with the columns `deck, id, situation, line, followUp, tip`. Open it in Excel or Google Sheets (or paste it into an AI chat) and add rows:

- `deck`: one of `morning, class, recess, lunch, after-school, goodbye, brain-freeze, tricky, stand-up` (the deck's name, like `Morning Hello`, also works)
- `id`: **keep it on existing cards** (kids' progress is saved under it). **Leave it blank on new cards**; the import makes one.
- `situation` (front), `line` (what to say), and optionally `followUp` and `tip`

Several rows can share the same situation with different lines, which is how you give kids more ways to say the same thing. Then import it back:

```bat
npm run cards:import -- cards-export.csv --dry-run
npm run cards:import -- cards-export.csv
```

The dry run shows what would change (new, changed, removed per deck) without writing anything. The import refuses to write if any row has a problem and tells you the row number. Rows you delete from the file are removed from the app. In Excel, save as **CSV UTF-8** so apostrophes and emoji survive.

To add a whole new deck, add it to `src/content/decks.js` (id, name, emoji, color, text color) before importing cards for it.

For cards that only matter to one family, use **Grown-ups settings > Your cards** in the app instead.

## Data (Firestore)

```
families/{code}                               name, createdAt
families/{code}/kids/{kidId}                  name, avatar, color, points, streak, lastPracticeDate
families/{code}/kids/{kidId}/cards/{cardId}   practiced, practicedWithParent, practicedWithFriend,
                                              usedForReal, mission, hidden, lastPracticed, customLine
families/{code}/customCards/{cardId}          categoryId, situation, line, followUp, tip
```

## Security notes

- The family code is the document id and works like a password. The rules in `firestore.rules` let anyone who knows a code open that family, but nobody can list codes. Only the admin Google account can create or delete families.
- A 4-digit code could be guessed by a script. Use 6+ digit codes for families outside your own (the admin page suggests 6-digit random codes).
- The admin email lives in two places that must match: `firestore.rules` and `src/lib/admin.js`.

## Project layout

```
src/
  cards.js              assembles decks (content/decks.js) + cards (content/cards.json), merges family cards
  firebase.js           Firebase app + Firestore (reads .env)
  App.jsx               family gate, routes, screens
  lib/store.js          every Firestore read and write
  lib/admin.js          Google sign-in for the admin page
  lib/streak.js         points and streak rules
  lib/mathGate.js       grown-ups math lock (problem, answer, lockout)
  hooks/                useFamily, useKids, useKidProgress, useRoute, useStoredState
  components/           ProfilePicker, Home, CategoryTile, Practice, Card, Confetti, MathGate,
                        TrophyRoom, Settings, CardEditor, KidEditor, AdminPanel, CodePad, ...
firestore.rules         security rules
firebase.json           hosting (SPA rewrites) + rules config
tools/                  cards-export.mjs / cards-import.mjs (npm run cards:export / cards:import)
```
