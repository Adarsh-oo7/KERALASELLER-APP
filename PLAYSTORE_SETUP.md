# Kerala Sellers — Play Store Publishing Guide

## Prerequisites

1. **Google Play Console account** — https://play.google.com/console  
2. **EAS CLI** — `npm install -g eas-cli` + `eas login`  
3. **Expo account** — https://expo.dev (owner: `adarsh-090`)
4. **App already linked** — `eas init` (already done, projectId: `2d41715a-92fc-4294-8705-33739189f1fd`)

---

## Step 1 — Set EAS Secrets (DO NOT put in .env or git)

Run these commands once on your machine:

```bash
# Your google-services.json content
eas secret:create --scope project --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json

# Production API URL
eas secret:create --scope project --name EXPO_PUBLIC_API_BASE_URL --value https://api.keralasellers.in
```

This stores secrets in EAS cloud — builds pick them up automatically.

---

## Step 2 — Remove committed secrets from git

```bash
# Remove .env and google-services.json from tracking
git rm --cached .env .env.production google-services.json 2>/dev/null
git commit -m "chore: untrack secret files"
git push
```

---

## Step 3 — Build Production AAB (Android App Bundle)

```bash
# This builds a signed .aab for Play Store
eas build --platform android --profile production
```

EAS will:
- Auto-increment `versionCode`
- Use the `GOOGLE_SERVICES_JSON` secret
- Generate/manage your keystore automatically
- Output a `.aab` file for download

**IMPORTANT: Save your keystore!**  
After first build, run: `eas credentials` and download your keystore backup.
Losing it = you can never update your app on Play Store.

---

## Step 4 — Create App in Play Console

1. Go to https://play.google.com/console
2. Click **Create app**
3. Fill in:
   - App name: `Kerala Sellers`
   - Default language: `English (India)`
   - App type: `App`
   - Free or paid: `Free`
4. Package name: `com.keralasellers.app`

---

## Step 5 — Upload to Internal Testing First

1. In Play Console → **Testing** → **Internal testing** → **Create new release**
2. Upload the `.aab` from Step 3
3. Add testers (your own Gmail)
4. Test thoroughly before promoting

---

## Step 6 — Store Listing (Required before review)

You need to provide:
- [ ] App icon (512x512 PNG)
- [ ] Feature graphic (1024x500 PNG)
- [ ] At least 2 screenshots (phone + 7" tablet optional)
- [ ] Short description (80 chars)
- [ ] Full description (4000 chars)
- [ ] Privacy Policy URL (required — host at keralasellers.in/privacy)
- [ ] Content rating questionnaire
- [ ] Target audience settings

---

## Step 7 — Submit to Production

Once internal testing passes:

```bash
# Auto-submit to Play Store (internal track first)
eas submit --platform android --profile production
```

Or manually upload from Play Console.

---

## Subsequent Updates

```bash
# Build new version (versionCode auto-increments)
eas build --platform android --profile production

# Submit updated build
eas submit --platform android --profile production --latest
```

---

## OTA Updates (no new build needed for JS changes)

```bash
# Push JS-only update instantly to all users
eas update --branch production --message "Fix: product display bug"
```

This updates all users who have the app open within minutes.
Does NOT require Play Store review for JS/asset changes.

---

## Checklist Before Play Store Submission

- [ ] Backend URL is `https://api.keralasellers.in` (not 192.168.x.x)
- [ ] `DEBUG=False` on backend
- [ ] `google-services.json` removed from git, set as EAS Secret
- [ ] `.env` removed from git
- [ ] Privacy policy page live at keralasellers.in/privacy
- [ ] App tested on real Android device
- [ ] All "Coming Soon" screens either implemented or hidden
- [ ] Keystore backed up from `eas credentials`
- [ ] Store listing complete (icon, screenshots, description)
