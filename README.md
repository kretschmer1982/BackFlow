## BackFlow – Purpose and Features

BackFlow is a small training app for short, structured workouts – focused on back health, posture and everyday‑friendly exercises.

- **Purpose**  
  - Helps you perform recurring back and mobility exercises consistently.  
  - Lets you build your own workouts with suitable exercises that fit easily into your daily routine.

- **Core Features**  
  - **Create and manage workouts**: Any sequence of exercises with time (seconds) or repetitions.  
  - **Create custom exercises**: Define name, instructions and optionally an image and reuse them in workouts.  
  - **Guided workout run**: Get‑ready countdown, clear display of the current exercise, optional beeps in the last 3 seconds.  
  - **Settings**: Global background color, training reminders and beep sound can be configured.

## Run the project locally (development)

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Start the development server**

   ```bash
   npx expo start
   ```

3. **Test with Expo Go (Android or iOS)**  
   - Install the **Expo Go** app from the respective store on your phone.  
   - Scan the **QR code** shown in the terminal or browser devtools.  
   - The app runs inside Expo Go; code changes are picked up via hot reload.

> Note: Expo Go is a sandbox container. Some native features (e.g. custom native modules) are limited there, but for this app Expo Go is sufficient for testing.

## Install Android APK directly

Besides testing in Expo Go you can also install BackFlow as a native Android APK.

- **Build APK with EAS (if you build it yourself)**  

  In `eas.json` there is a build profile `apk`. Create an internal APK with:

  ```bash
  npx eas build -p android --profile apk
  ```

  After the build finishes you’ll get a link to the EAS build page where you can download the APK.

- **Install the APK manually**  

  1. Copy the APK to your Android device (download link, USB, AirDrop‑equivalent, …).  
  2. In **Settings → Security** allow “Install unknown apps / sources” for the used app (browser/file manager).  
  3. Tap the APK in your file manager and confirm the installation.  
  4. “BackFlow” will then appear as a normal app on the home screen.

## Development notes

- The main app code lives in the `app` directory and uses [Expo Router’s file‑based routing](https://docs.expo.dev/router/introduction).  
- Tests (E2E with Playwright) are located in the `tests` directory.
