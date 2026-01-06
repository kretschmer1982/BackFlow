# BackFlow

BackFlow is a simple, focused workout companion to help you build a consistent back & core routine. It lets you create workouts, plan training days, and run guided sessions with timers and spoken cues.

## Core features

- **Workouts**: Create and edit workouts from a list of exercises (duration- or reps-based).
- **Planner**: Plan up to **3 trainings per day** and set routine days.
- **Run mode**: Guided workout execution with countdowns, optional beeps, and voice announcements.
- **Stats**: Monthly training frequency and yearly totals.
- **Customization**: App background color and training reminder settings.

## Run locally (development)

```bash
npm install
npx expo start
```

## Install the app manually via APK (Android)

### APK location / links

- **Repo path**: `builds/android/application-340ee1a5-16da-40b8-8108-f14c3af88337.apk`
- **EAS Build link** (if you built via EAS): copy the `.apk` download URL from your build in the Expo dashboard (Project → Builds → Android).

1. **Get the APK** on your Android device (download it from a build link, transfer it via USB, or share it from another device).
2. On Android, enable installing from unknown sources:
   - **Android 8+**: `Settings` → `Apps` → `Special app access` → `Install unknown apps` → allow your browser / file manager.
   - **Android 7 and below**: `Settings` → `Security` → enable `Unknown sources`.
3. Open the APK file and tap **Install**.
4. After installation, you can disable “Install unknown apps” again if you want.

## Notes

- If you install a new APK over an old one, the package name must match and the APK must be signed appropriately.
- This project uses [Expo Router](https://docs.expo.dev/router/introduction/) (file-based routing).
