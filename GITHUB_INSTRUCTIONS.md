# Step-by-Step Guide: Building APK on GitHub

Follow these steps to build your Android APK using GitHub Actions (totally free and no Android Studio required).

### Step 1: Export your code to GitHub
1.  In **AI Studio Build**, look at the top-right corner.
2.  Click on the **Settings** gear icon (or the **Share** button).
3.  Choose **Export to GitHub**.
4.  Follow the prompts to connect your GitHub account and create a new repository (e.g., `kite-control-app`).

### Step 2: Create the Build Workflow on GitHub
1.  Go to your new repository on [github.com](https://github.com).
2.  Click the **"Add file"** button and choose **"Create new file"**.
3.  In the filename box, type exactly: `.github/workflows/build_apk.yml` (The folders will be created automatically).
4.  Paste the following code into the editor:

```yaml
name: Build Android APK
on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Install Java
        uses: actions/setup-java@v4
        with:
          distribution: 'zulu'
          java-version: '17'
          
      - name: Install Flutter
        uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.x'
          channel: 'stable'
          
      - name: Get Dependencies
        run: |
          cd flutter_child_app
          flutter pub get
          cd ../flutter_parent_app
          flutter pub get
          
      - name: Build Child App APK
        run: |
          cd flutter_child_app
          flutter build apk --release
          
      - name: Build Parent App APK
        run: |
          cd flutter_parent_app
          flutter build apk --release
          
      - name: Upload Child APK
        uses: actions/upload-artifact@v4
        with:
          name: child-app-release
          path: flutter_child_app/build/app/outputs/flutter-apk/app-release.apk
          
      - name: Upload Parent APK
        uses: actions/upload-artifact@v4
        with:
          name: parent-app-release
          path: flutter_parent_app/build/app/outputs/flutter-apk/app-release.apk
```

### Step 3: Commit and Run
1.  Scroll down to the bottom of the page.
2.  Click the green **"Commit changes..."** button.
3.  Click **"Commit changes"** again.
4.  GitHub will now automatically start the build process.

### Step 4: Download your APK
1.  Click the **"Actions"** tab at the top of your GitHub repository.
2.  You will see a workflow run in progress (usually called "Build Android APK"). Click on it.
3.  Wait about 5-8 minutes for the green checkmark ✅ to appear.
4.  Once finished, scroll down to the **"Artifacts"** section at the bottom.
5.  Click on `child-app-release` or `parent-app-release` to download the ZIP file containing your APK!

---
*Tip: You only need to set this up once. Every time you push new code from AI Studio, GitHub will build a new APK for you automatically!*
