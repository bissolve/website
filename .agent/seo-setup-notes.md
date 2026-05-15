# SEO & AI Setup Notes (Phase 0 Findings)

## 1. Framework / Stack
Plain HTML. There are no build tools, package managers, or framework configuration files. The site consists of standard `.html` files (`index.html`, `calendar.html`, `services.html`, `style-guide.html`).

## 2. Static Files Root
Since this is a plain HTML site, the static files belong in the project root (`/`). All root-level files like `robots.txt` and `sitemap.xml` will be placed directly in the main directory.

## 3. Site Identity
- **Site Name**: Bissolve
- **Description**: We build and manage the tech systems that help businesses run smarter, grow faster, and stop losing time to things a system should handle. Bissolve is here. Let's Solve It.
- **Canonical Domain**: https://www.bissolve.com (found in CNAME and OG tags)
- **Primary Language**: English
- **Logo Path**: `images/favicon.png` or `images/blue_logo1.png`
- **Organization**: Bissolve
- **Social Links**: Not explicitly found in the head metadata, but will use placeholders or leave out if unavailable.

## 4. Content Inventory
- `/index.html` (Homepage)
- `/calendar.html`
- `/services.html`
- `/style-guide.html`

## 5. Existing Files
- `robots.txt`: **Missing**
- `sitemap.xml`: **Missing**
- `favicon.ico`: **Missing** at root (but referenced from `images/`)
- `manifest.json`: **Missing**
- `llms.txt`: **Missing**
- **JSON-LD Blocks**: **Missing**
- **Open Graph Tags**: **Exist** in `index.html` (`og:title`, `og:description`, `og:image`, `og:url`, `og:site_name`, `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image` are present but might need verification across all pages).
