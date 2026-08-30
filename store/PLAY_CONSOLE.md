# Kerala Sellers on Google Play

Package: `in.keralasellers.app`  
Version: `1.0.0` (versionCode `1`)  
Privacy: https://www.keralasellers.in/privacy-policy  
Terms: https://www.keralasellers.in/terms-and-conditions  
Support: keralasellers.in@gmail.com

This app is for **shop owners**, not for shoppers.

## 1. Build the file Play wants

Play does not accept a normal APK for a new app. It wants an **Android App Bundle** (`.aab`).

From the `app` folder, after `eas login`:

```bash
npm run build:android
```

When Expo finishes, download the `.aab`. Keep the Expo Android keystore in your Expo account. Never make a second first-time keystore.

Current production bundle (`1.0.0` / versionCode `1`):

https://expo.dev/artifacts/eas/s_fR4fXjFxin693GAupdKv2lVllSefb9OMRaHGtCbEU.aab

Build logs: https://expo.dev/accounts/adarsh-090/projects/kerala-sellers/builds/c5fb7b87-f88a-494c-b53a-518659b65f53

## 2. Open Play Console

1. Go to https://play.google.com/console
2. Sign in with the Google account that paid the one-time Play developer fee.
3. **Create app**
   - App name: `Kerala Sellers`
   - Default language: English (United States) or English (India)
   - App or game: **App**
   - Free or paid: **Free**
   - Declarations: you accept Play policies and US export rules

## 3. Store listing (Main store listing)

**App name:** Kerala Sellers (30 characters max)

**Short description** (80 characters max):

```
Seller app for Kerala shops: products, billing, orders, and GST bills.
```

**Full description:**

```
Kerala Sellers is the seller app for shop owners on keralasellers.in.

Use it to run your shop from your phone:
• Add products with photos, category, size, colour, kg or litre packs
• Print or share walk-in bills
• See online orders and update status
• Scan barcodes at the till
• Track stock, expenses, and subscription

This app is for sellers only. Shoppers should use the website or the shop link, not this app.

Kerala Sellers provides software. Each shop sells its own products. Kerala Sellers is not the seller, courier, or GST registrant for those products.

Need help? Email keralasellers.in@gmail.com
Privacy: https://www.keralasellers.in/privacy-policy
Terms: https://www.keralasellers.in/terms-and-conditions
```

**Graphics**

- App icon: Play takes this from the bundle. You can also upload `assets/icon.png` (1024×1024).
- Feature graphic: upload `store/feature-graphic.png` (1024×500). Required.
- Phone screenshots: at least **2**, JPEG or PNG, 16:9 or 9:16. Capture from a real phone or emulator:
  1. Login / Home
  2. Products
  3. Add product
  4. Billing / new bill
  5. Orders
- Tablet screenshots: optional for a phone-only app.
- Promo video: optional.

**Category:** Business  
**Tags:** point of sale, billing, inventory, ecommerce, shop  
**Contact:** keralasellers.in@gmail.com  
**Privacy policy:** https://www.keralasellers.in/privacy-policy

## 4. Upload the app (do not start on Production)

Play wants an **Android App Bundle** (`.aab`), not an APK.

Build page: https://expo.dev/accounts/adarsh-090/projects/kerala-sellers/builds

### A. Internal testing (you first)

1. Play Console → your app → **Test and release → Testing → Internal testing**
2. Create a new release
3. Upload the `.aab` from Expo
4. Release name: `1.0.0 (1)`
5. Release notes:

```
First public seller app: products, walk-in bills, orders, and shop tools.
```

6. Save, add your Gmail as a tester, then roll out the internal test
7. Open the opt-in link on an Android phone, install from Play, then walk through login, add product, bill, and logout

Internal testing is optional for Google, but do it. It is the fastest way to catch a broken login before reviewers see it.

### B. Closed testing (required for many new personal accounts)

If this Play developer account is **personal** and was created **after 13 Nov 2023**, Production stays locked until:

- you finish the store listing and policy forms below
- you run **Closed testing**
- **at least 12 testers** opt in from the Play invite link
- they stay opted in **continuously for 14 days**
- they actually open and use the app

Then Dashboard → **Apply for production**. Organisation accounts, and older personal accounts, can skip this and go to Production after review.

Recruit 14–16 Kerala shop owners or staff so a dropout does not drop you below 12. Tell them they must stay opted in for the full 14 days.

Closed testing testers need a real Android phone and the Google account you invited. Adding emails to a list is not enough until they tap Join and install from Play.

### C. Production (last)

Only after the internal install works, and (if required) closed testing is done:

1. Test and release → **Production**
2. Create a release from the same `.aab` (or a newer versionCode)
3. Countries: start with **India**
4. Send for review

Do not upload a second first-time keystore. Expo already has Android credentials **Aw5QyQea2w**. Keep that Expo login. On first Play upload, turn on **Play App Signing** (Google’s default).

## 5. Forms Play will not skip

Complete every item under **Monitor and improve** / **Policy** until the dashboard is green.

**App access** (paste in English)

Login for existing sellers is **phone + password**. OTP is only for new registration. Do not ask Play to register.

Create a dedicated demo shop first (or use one you already own). Give it an active software plan so Products, Billing, and Orders work. Then paste:

- Name: `Google Play reviewer seller account`
- Username: `+91` plus the 10-digit mobile (example `+9198XXXXXXXX`)
- Password: the demo shop password (must not expire)
- Any other information:

```
Seller app for shop owners. Do not tap Register. On Sign in, type the 10-digit Indian mobile (the +91 prefix is already shown) and the password. Returning login does not use OTP, 2FA, QR, or biometrics. After login use Home, Products, Billing, Orders, and More. New bill is on Home. Delete account is in More. This demo shop has an active software plan so seller tools are unlocked. Do not complete Razorpay payment.
```

Tick that these details give full access, including premium tools. Test the same phone and password on Internal testing before you submit.

**Data collection and security** (this Play screen)

- Collect or share required user data types: **Yes**
- Encrypted in transit: **Yes**
- Account creation: **Username, password, and other authentication** (phone + password; Firebase OTP only when a new seller registers)
- Delete account URL: https://www.keralasellers.in/delete-account
- Delete some data without closing the account: **No**
- Independent security review / UPI Payments verified badges: leave unchecked

**Ads**  
No ads. Choose **No, my app does not contain ads**.

**Content rating**  
Start questionnaire. Category: **Utility, Productivity, Communication, or other**. Answer no to violence, language, and news unless true. Submit and apply the rating.

**Target audience**  
Age 18+. This is a business tool, not a children’s app. Do not target under 18.

**News app**  
No.

**COVID**  
No.

**Data types** (select only these)

- Location: Approximate location only (IP / city sent to Firebase and Razorpay). Not precise GPS.
- Personal info: Name, Email address, User IDs, Address, Phone number
- Financial info: User payment info, Purchase history, Other financial info (GST, bills, expenses)
- Photos and videos: Photos only
- App activity: Other user-generated content (products, bills, shop text)
- Device or other IDs: yes (Firebase)

Do not select Contacts, SMS, Videos, Precise location, Health, Calendar, Web browsing, Crash logs, or Advertising ID.

**Data safety** (must match the real app)

Collected and used for app functionality, account, and fraud prevention:

- Name
- Phone number
- Photos (shop logo and product photos)
- User IDs
- Crash logs / diagnostics (if any)
- Payment info is processed by Razorpay; you do not store full card numbers

Shared with:

- Firebase (phone login)
- Cloudinary (product and shop images)
- Razorpay (subscription and add-on payments)
- Your API at api.keralasellers.in

Also tick:

- Data is encrypted in transit
- Users can request deletion (More → Delete account)
- You do **not** sell data
- You do **not** use advertising ID (the Play build blocks AD_ID)

**Government apps**  
No.

**Financial features**  
Yes: the app can take shop payments and pay for the Kerala Sellers software plan. It is not a bank or wallet.

**Health**  
No.

**Photos and videos**  
Declare camera (barcode scan) and photos (product / logo). One-time or while using the app. Not background.

**Health Connect / Background location**  
No. Do not claim location if you do not use it.

## 6. Countries and pricing

- Countries: start with **India**. Add others later if you want.
- App is free. In-app products are not Play Billing; sellers pay Kerala Sellers plans through Razorpay, same as the website.

## 7. Before you press Send for review

- Internal test install works on a real Android phone
- Privacy and terms URLs open
- Delete account is in More
- Feature graphic and 2+ screenshots uploaded
- Data safety saved
- Content rating applied
- Test login given to Play if the app is locked behind OTP

Review often takes a few days. If Play asks about payments, answer that this is a seller tool for physical shops; platform fees are for software access, matching the website.

## 8. Later updates

Bump `version` and `android.versionCode` in `app.json` (for example 1.0.1 and 2), run `npm run build:android`, and upload the new `.aab` to a new release. Never lose the original upload keystore in Expo.
