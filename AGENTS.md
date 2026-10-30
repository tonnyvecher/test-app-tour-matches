This is a small Expo / React Native test project (Expo SDK 57, single screen, no router). It runs in a browser (`npm run web`) and in Expo Go.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. Before writing code that touches an Expo or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt and follow its links; never answer from memory.

## Commands

```bash
npx expo install <package>  # use instead of npm install <package> — picks SDK-compatible versions
npm run web                 # run in a browser
npm start                   # run in Expo Go
npx tsc --noEmit            # typecheck
npx expo lint               # lint
```

Run typecheck before declaring a task done. Do not add native modules that need a development build — the app must keep working in Expo Go.
