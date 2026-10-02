# SHE-SHIELD on your phone

This is the Expo Go version of the review tool. It uses the same synthetic records, lead rules, decisions, and coordination brief as the browser app. The desktop three-column layout is split into a leads list, a lead screen, and a decision screen.

## Open it in Expo Go

1. Install **Expo Go** from the App Store or Play Store, and update it if it is already installed. This project uses Expo SDK 57.
2. Put your phone and this computer on the same Wi-Fi.
3. From this folder:

```bash
npm install
npx expo start
```

4. Scan the QR code.
   - iPhone: use the Camera app, then open the link in Expo Go.
   - Android: scan from inside Expo Go.

If the phone cannot reach the computer, start with a tunnel instead:

```bash
npx expo start --tunnel
```

## What you can do

- Browse area/timing leads and links named in the data.
- Change the day windows, add a fictional example, and run analysis again.
- Open a lead, compare the two records, and generate a coordination brief.
- Record Verified, Needs more info, or Dismissed. Those decisions stay on the phone for this session.

The app starts in offline mode. Briefs are written from the local template, which matches the browser tool when the API is unreachable. To talk to a running API, set `EXPO_PUBLIC_API_BASE_URL` to your computer's address, for example `http://192.168.1.20:4000`, then restart Expo. `localhost` points at the phone, not the computer.
