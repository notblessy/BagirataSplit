# Bagirata - Version 2.0.0

This is the new major version 2 of Bagirata, built with React Native and Expo. It maintains the same bundle identifier (`keepgoing.Bagirata`) as the iOS version to ensure they are treated as the same app.

## Project Configuration

- **Version**: 2.0.0
- **Build Number**: 2
- **Bundle Identifier**: `keepgoing.Bagirata`
- **Package Name**: `keepgoing.Bagirata`

## EAS Build & Deploy Setup

### Prerequisites

1. Install EAS CLI globally (if not already installed):

```bash
npm install -g eas-cli
```

2. Login to your Expo account:

```bash
eas login
```

3. Configure your project:

```bash
eas init
```

### Build Commands

- **Development Build**:

```bash
npm run build:android -- --profile development
npm run build:ios -- --profile development
```

- **Preview Build**:

```bash
npm run build:android -- --profile preview
npm run build:ios -- --profile preview
```

- **Production Build**:

```bash
npm run build:android -- --profile production
npm run build:ios -- --profile production
```

### Submit to App Stores

- **Submit to Google Play**:

```bash
npm run submit:android
```

- **Submit to App Store**:

```bash
npm run submit:ios
```

## Configuration Files to Update

### Before Building

1. **google-services.json**: Replace the placeholder file with your actual Firebase configuration
2. **android-service-account.json**: Add your Google Play service account key for automatic submissions
3. **eas.json**: Update the Apple ID and ASC App ID in the submit configuration

### AdMob Configuration

The app is configured with Google AdMob:

- **App ID**: ca-app-pub-8857414531432199~1645598742
- **SKAdNetwork**: Configured with all major ad network identifiers

## Version Alignment with iOS

This Android version is aligned with the iOS Bagirata app:

- Same bundle identifier to maintain app continuity
- Version 2.0.0 as a new major version
- Build number 2 to continue from iOS version
- Same AdMob configuration
- Same SKAdNetwork identifiers

## Development

Start the development server:

```bash
npm start
```

Run on Android:

```bash
npm run android
```

Run on iOS:

```bash
npm run ios
```

## Notes

- The app uses Expo Router for navigation
- SQLite is configured for local data storage
- The app supports both iOS and Android with the same codebase
- Google Mobile Ads is integrated for monetization
