# PLAYBOOK app download redirect

A lightweight, static page for one QR code and website link. Android visitors are sent to Google Play, and iPhone/iPad visitors are sent to the App Store after a short 900 ms delay. Desktop visitors see buttons for the App Store, Google Play, and the PLAYBOOK web version. All three buttons remain available if automatic redirection does not happen. The page has no ads, analytics, external scripts, fonts, dependencies, or third-party redirect service.

## Files

- `index.html` — the complete page, styles, and device redirect logic.
- `42.png` — the PLAYBOOK logo used on the page.
- `tests/test_download_page.py` — dependency-free checks for the page's links and logo.
- `qr/` — existing QR exports; check their encoded URL before using them.

No build command or Vercel configuration is needed.

## One link for the QR code and website button

Use **https://download.get-playbook.com/** in both places:

- Encode it in the static QR code.
- Set it as the destination of the Download button on the main PLAYBOOK website.

For a plain HTML website button:

```html
<a href="https://download.get-playbook.com/">Download PLAYBOOK</a>
```

The visitor's browser runs the device check after opening that URL. Android goes to Google Play, iPhone/iPad goes to the App Store, and desktop shows all three choices. You do not need separate QR codes or website links for each platform. Existing QR exports should be scanned before use; regenerate them if they encode the older Vercel URL.

## Publish an update

1. Review the local changes and run `python3 -m unittest discover -s tests -v`.
2. Commit and push `index.html`, `42.png`, `README.md`, and `tests/` from GitHub Desktop when you are ready. Vercel will deploy the connected repository.
3. Check `https://download.get-playbook.com/` on desktop, Android, and iPhone/iPad after deployment.

To make a new QR code, encode `https://download.get-playbook.com/` directly as a **static** QR, without a dynamic QR service or short link. Export **SVG for print** and **PNG for digital use**, then scan both files to confirm the destination.

## Quick checks

- Desktop browser: the page remains visible and all three buttons work.
- Android phone: the page briefly shows a Google Play message, then opens the Google Play listing.
- iPhone or iPad: the page briefly shows an App Store message, then opens the App Store listing.
- If a browser blocks the redirect or JavaScript is disabled, visitors can choose a button manually.

The [App Store](https://apps.apple.com/bh/app/playbook-network/id1622077073), [Google Play](https://play.google.com/store/apps/details?id=com.mightybell.playbook), and [PLAYBOOK web version](https://app.get-playbook.com/app) URLs are defined in `index.html`.
