# PLAYBOOK app download redirect

A lightweight, static page for one QR code URL. Android visitors are sent to Google Play, and iPhone/iPad visitors are sent to the App Store after a short 900 ms delay. Desktop visitors see both download buttons. The buttons stay visible if automatic redirection is unavailable. The page has no ads, analytics, external scripts, dependencies, or third-party redirect service.

## Files

- `index.html` — the complete page, styles, and device redirect logic.

No build command or Vercel configuration is needed.

## One link for the QR code and website button

After deployment, use the **same production Vercel URL** in both places:

- Encode it in the static QR code.
- Set it as the destination of the Download button on the main PLAYBOOK website.

For a plain HTML website button, replace the example URL with your actual production Vercel URL:

```html
<a href="https://YOUR-PROJECT.vercel.app/">Download PLAYBOOK</a>
```

The visitor's browser runs the device check after opening that URL. Android goes to Google Play, iPhone/iPad goes to the App Store, and desktop shows both store buttons. You do not need separate QR codes or separate website links for each platform.

## Deploy to Vercel

1. Create a GitHub repository named `playbook-app-download-redirect`.
2. Upload `index.html` and `README.md`, or push this folder to that repository.
3. In Vercel, choose **Add New → Project**, import the GitHub repository, and leave the root directory at the repository root.
4. Deploy the project. Vercel will serve `index.html` as the home page.
5. Copy the production Vercel URL (for example, `https://playbook-app-download-redirect.vercel.app/`). Use the actual URL assigned to your project.
6. Point the Download button on the main PLAYBOOK website to that production URL.
7. Generate a **static** QR code whose encoded content is exactly the same URL. Use an offline QR generator or a generator that outputs a direct QR code; avoid any “dynamic QR” or short-link redirect option.
8. Download the QR code as **SVG for print** and **PNG for digital use**. Scan both exports to confirm they open the production Vercel URL directly.

If you later connect a custom domain, regenerate the QR code only if you want the QR to point to that domain. Keep the original Vercel URL active for any QR codes already printed.

## Quick checks

- Desktop browser: the page remains visible and both store buttons work.
- Android phone: the page briefly shows a Google Play message, then opens the Google Play listing.
- iPhone or iPad: the page briefly shows an App Store message, then opens the App Store listing.
- If a browser blocks the redirect or JavaScript is disabled, visitors can use either store button manually.

The [App Store](https://apps.apple.com/bh/app/playbook-network/id1622077073), [Google Play](https://play.google.com/store/apps/details?id=com.mightybell.playbook), and [PLAYBOOK website](https://www.get-playbook.com/) URLs are defined in `index.html`.
