# Google Play Store Publishing Guide

Publishing a **Parental Control** app like KiteControl requires strict adherence to Google Play policies, especially regarding sensitive permissions.

## 1. Prerequisites
- **Developer Account**: Create a [Google Play Developer Console](https://play.google.com/console) account ($25 one-time fee).
- **Signed Bundle**: You must sign your app with a private key.
- **Privacy Policy**: Required for all apps, especially those handling location and child data.

## 2. Technical Preparation
### Generate a Signed App Bundle (AAB)
1. In your Flutter/Android project, configure `key.properties` and `build.gradle`.
2. Run: `flutter build appbundle --release`
3. This generates `build/app/outputs/bundle/release/app-release.aab`.

### ProGuard/R8 Obfuscation
Ensure your `proguard-rules.pro` protects sensitive logic while stripping unused code to keep the app lightweight.

## 3. Policy Compliance (Critical)
Parental Control apps are heavily scrutinized. You must submit the **Permission Declaration Form** for:
- **Accessibility Service**: You must clearly explain that it is used for "App Blocking and Parental Oversight".
- **Location (Background)**: You must justify why background location is essential (Safe Zones).
- **VpnService**: Declare its use for "Local Content Filtering" (DNS interception).

> **Pro Tip**: Record a video of your app showing exactly how the parent grants these permissions and how the child is notified. Google reviewers will ask for this.

## 4. Store Listing
- **High-Res Icon**: 512x512 PNG.
- **Feature Graphic**: 1024x500.
- **Screenshots**: At least 2 for Phone, 7" Tablet, and 10" Tablet.
- **Data Safety Section**: Disclose that you collect Location, App Usage, and Device IDs.

## 5. Review Timeline
- Regular apps: 3-7 days.
- Apps with sensitive permissions (like KiteControl): **7-14 days**.
- Be prepared for rejection on the first try; carefully address the policy feedback provided by the reviewer.

---

*This guide is part of the KiteControl Architecture Specification.*
