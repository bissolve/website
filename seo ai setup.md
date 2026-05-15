# Task: Make this website SEO-friendly and AI-agent-friendly

You are working inside this repository as an autonomous agent. Your job is to add all the standard discovery, indexing, and AI-readability files this site is currently missing, and to add inline metadata to existing pages so search engines and LLMs can understand the site correctly.

Work through the phases in order. Don't skip the **Phase 0 discovery step** — every later phase depends on what you find there.

---

## Phase 0 — Discover the project (do this first)

Before creating any file, gather the following and write your findings into a short scratchpad at `./.agent/seo-setup-notes.md`:

1. **Framework / stack.** Look at `package.json`, `requirements.txt`, `Gemfile`, `astro.config.*`, `next.config.*`, `nuxt.config.*`, `gatsby-config.*`, `_config.yml`, `hugo.toml`, `vite.config.*`, etc. Identify exactly one of: Next.js, Astro, Nuxt, SvelteKit, Gatsby, Hugo, Jekyll, Eleventy, plain HTML, WordPress (PHP), Vite SPA, other.
2. **Where static files belong.** Identify the public root (e.g. `public/`, `static/`, `assets/`, project root). All root-level files (`robots.txt`, `sitemap.xml`, `llms.txt`, etc.) must be served from `/` in production — confirm the path before writing.
3. **Site identity.** Find or infer: site name, one-sentence description, canonical domain, primary language, logo path, organization/author name, social links. Sources to check: `package.json`, `README.md`, site config files, `<title>` / `<meta>` tags in existing pages, footer content.
4. **Content inventory.** Enumerate the top-level routes/pages and the content collections (blog posts, docs, products, etc.). You'll use this to populate `sitemap.xml` and `llms.txt`.
5. **Existing files.** Check whether `robots.txt`, `sitemap.xml`, `favicon.ico`, `manifest.json`, `llms.txt`, JSON-LD blocks, Open Graph tags already exist. **Do not overwrite without reading first** — merge or extend instead.

If any of the above is genuinely ambiguous after looking, ask the user **one** consolidated question listing the gaps. Otherwise proceed.

---

## Phase 1 — Classic SEO files (root of public directory)

### 1.1 `robots.txt`

Create or update. Allow general crawling, allow AI crawlers explicitly (the user wants AI discoverability), and point to the sitemap. Use this template, substituting `www.bissolve.com`:

```
User-agent: *
Allow: /

# AI crawlers — explicitly allowed for discoverability
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: CCBot
Allow: /

User-agent: anthropic-ai
Allow: /

Sitemap: https://www.bissolve.com/sitemap.xml
```

If the user later wants to **block** AI training crawlers (common preference), change `Allow: /` to `Disallow: /` for `GPTBot`, `Google-Extended`, `anthropic-ai`, and `CCBot`. Note this decision in the scratchpad.

### 1.2 `sitemap.xml`

Prefer auto-generation by the framework when available:

- **Next.js (App Router):** create `app/sitemap.ts` exporting a default function.
- **Astro:** install `@astrojs/sitemap` and add to `astro.config.mjs`.
- **Nuxt:** install `@nuxtjs/sitemap`.
- **Gatsby:** `gatsby-plugin-sitemap`.
- **Hugo / Jekyll / Eleventy:** sitemap is built-in or via a one-line plugin.
- **Plain HTML / unknown:** generate a static `sitemap.xml` by enumerating the routes you found in Phase 0.

Every URL entry needs `<loc>`, `<lastmod>`, and ideally `<changefreq>` + `<priority>`. Static template for fallback:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://www.bissolve.com/</loc>
    <lastmod>{{TODAY_ISO_DATE}}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <!-- one <url> block per page -->
</urlset>
```

### 1.3 RSS / Atom feed (only if the site has a blog or news section)

Use the framework's idiomatic plugin. Place at `/rss.xml` or `/feed.xml`. Skip if there's no time-ordered content.

### 1.4 Icons & manifest

- Ensure `favicon.ico`, `apple-touch-icon.png` (180×180), and `icon-512.png` exist at the public root.
- Create `manifest.json` (PWA manifest) with `name`, `short_name`, `description`, `start_url: "/"`, `display: "standalone"`, `theme_color`, `background_color`, and an `icons` array.
- Link both from `<head>` of the base layout.

---

## Phase 2 — AI-agent files (the actual reason for this task)

### 2.1 `llms.txt`

Plain Markdown at `/llms.txt`. Format strictly per the spec: H1 title, blockquote summary, then H2 sections of curated links. **Curate** — include only the pages an LLM should know about (homepage, about, key product/service pages, important docs). Don't dump every URL.

Template:

```markdown
# {{Site Name}}

> {{One-sentence description of what this site is and who it's for.}}

{{Optional 1–3 sentence longer context — what makes this site useful, who runs it, what to expect.}}


## Products / Services
<!-- one bullet per core offering, with a one-line description -->

## Documentation
<!-- include only if docs exist -->

## Blog
<!-- link to the index, not every post -->

## Optional

- [Privacy Policy](https://www.bissolve.com/privacy)
- [Terms](https://www.bissolve.com/terms)
```

Rules:
- File **must** be at the root: `https://www.bissolve.com/llms.txt` (or under a section path like `/docs/llms.txt` if it only describes that section).
- UTF-8 encoded. Markdown format. Keep under ~150K words.
- Only include `Allow`ed and `index`ed URLs — never link to noindex/private pages.

### 2.2 `llms-full.txt`

Same idea, but inline the full Markdown content of each linked page rather than just linking. Use this if total content fits in ~150K words (~700KB). Generate by concatenating Markdown exports of each page in `llms.txt`, separated by `\n\n---\n\n` and prefixed with the page title as an H1.

If the site is too large, skip this and rely on `.md` twins instead (next step).

### 2.3 `.md` twins of key pages

For each important HTML page, serve a Markdown version at the same path with a `.md` extension: e.g. `/about` → `/about.md`. LLM agents prefer these because they're free of nav chrome and JS.

Implementation by stack:

- **Next.js:** add a route handler `app/[slug]/route.ts` that returns Markdown with `Content-Type: text/markdown`.
- **Astro:** content collections already produce Markdown — expose a `.md` endpoint per entry.
- **Hugo:** enable a `markdown` output format in `hugo.toml`.
- **Static / unknown:** write the `.md` files manually next to the HTML.

Start with: homepage, about, pricing, top 3 product/service pages. Skip legal pages.

---

## Phase 3 — `.well-known/` files

Create these under `public/.well-known/`:

### 3.1 `security.txt` (RFC 9116)

```
Contact: mailto:security@www.bissolve.com
Expires: {{ONE_YEAR_FROM_TODAY_ISO}}
Preferred-Languages: en
Canonical: https://www.bissolve.com/.well-known/security.txt
```

### 3.2 `change-password`

Server-level redirect (or a tiny HTML file with a meta refresh) from `/.well-known/change-password` to the actual password-reset URL. Skip if there are no user accounts.

---

## Phase 4 — Inline metadata on every page

This is where most of the real SEO + AI lift comes from. Update the site's base layout / `<head>` template once so every page inherits it, then override per-page where relevant.

### 4.1 Standard `<head>` tags

```html
<title>{{Page Title}} — {{Site Name}}</title>
<meta name="description" content="{{1–2 sentence page summary, under 160 chars.}}">
<link rel="canonical" href="https://{{www.bissolve.com}}{{PATH}}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta charset="utf-8">
```

### 4.2 Open Graph + Twitter Card

```html
<meta property="og:type" content="website">
<meta property="og:site_name" content="{{Site Name}}">
<meta property="og:title" content="{{Page Title}}">
<meta property="og:description" content="{{Page summary.}}">
<meta property="og:url" content="https://www.bissolve.com{{PATH}}">
<meta property="og:image" content="https://www.bissolve.com/og-image.png">
<meta property="og:locale" content="en_US">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{{Page Title}}">
<meta name="twitter:description" content="{{Page summary.}}">
<meta name="twitter:image" content="https://www.bissolve.com/og-image.png">
```

If `og-image.png` doesn't exist, create a 1200×630 default and place at the public root.

### 4.3 JSON-LD structured data

Inject a `<script type="application/ld+json">` block in the base layout for `Organization` + `WebSite`, and a per-page block for the appropriate type:

**Base (every page):**

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "{{Site Name}}",
  "url": "https://www.bissolve.com",
  "logo": "https://www.bissolve.com/logo.png",
  "sameAs": [
    "{{Twitter URL}}",
    "{{LinkedIn URL}}",
    "{{GitHub URL}}"
  ]
}
</script>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "{{Site Name}}",
  "url": "https://www.bissolve.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://www.bissolve.com/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
</script>
```

(Omit the `SearchAction` block if the site has no search page.)

**Per-page types to use:**

| Page kind | Schema type |
|---|---|
| Blog post / article | `Article` or `BlogPosting` |
| Product page | `Product` (with `offers`, `aggregateRating` if real) |
| FAQ section | `FAQPage` |
| Step-by-step guide | `HowTo` |
| About page | `AboutPage` |
| Contact page | `ContactPage` |
| Person profile | `Person` |
| Local business | `LocalBusiness` |

Also add `BreadcrumbList` JSON-LD on any page deeper than the root.

### 4.4 Semantic HTML pass

Audit existing pages and fix:
- Exactly **one** `<h1>` per page, matching the `<title>`.
- Heading hierarchy doesn't skip levels (`<h1>` → `<h2>` → `<h3>`).
- `<nav>`, `<main>`, `<article>`, `<aside>`, `<footer>` used appropriately.
- Every `<img>` has descriptive `alt` text (empty `alt=""` only for decorative images).
- Every external link has `rel="noopener"` if it uses `target="_blank"`.

---

## Phase 5 — Verification

After all files are written, run these checks and report results to the user:

1. **Build succeeds.** Run the project's build command. No errors.
2. **Files served at expected paths.** Start a dev server and `curl -I` each of:
   - `/robots.txt` → 200, `text/plain`
   - `/sitemap.xml` → 200, `application/xml`
   - `/llms.txt` → 200, `text/plain` or `text/markdown`
   - `/.well-known/security.txt` → 200, `text/plain`
   - `/favicon.ico` → 200
   - `/manifest.json` → 200, `application/json`
3. **Sitemap validity.** Parse `sitemap.xml` and confirm every `<loc>` resolves to 200.
4. **JSON-LD validity.** For at least one page of each schema type, copy the JSON-LD block and validate it (manually note: user should test at `https://search.google.com/test/rich-results` and `https://validator.schema.org/`).
5. **Meta tag coverage.** Spot-check 3 pages: confirm `<title>`, `<meta name="description">`, canonical, OG tags, and JSON-LD are present.
6. **No accidental noindex.** Grep the codebase for `noindex` and confirm none of it leaked into shipped pages.

---

## Deliverables checklist

When done, post a summary message to the user listing exactly:

- [ ] Files created (paths)
- [ ] Files modified (paths + one-line reason)
- [ ] Configuration / plugin installs (commands run)
- [ ] Anything skipped and why (e.g. "no blog → no RSS feed")
- [ ] Open questions or follow-ups (e.g. "need real `og-image.png` — placeholder used")
- [ ] Manual next steps for the user (submit sitemap to Google Search Console + Bing Webmaster Tools, verify domain in each, test rich results)

---

## Rules of engagement

- **Don't overwrite existing config blindly.** Merge intelligently. If `robots.txt` exists with `Disallow` rules, preserve them.
- **Don't invent facts.** Site descriptions, organization details, social URLs must come from the repo or be left as `{{TODO}}` placeholders for the user to fill.
- **Prefer framework-idiomatic generation** over hand-written static files. If a plugin exists, use it.
- **Commit in logical chunks.** One commit per phase, with clear messages: `feat(seo): add robots.txt and sitemap`, `feat(ai): add llms.txt and .md twins`, etc.
- **No tracking scripts.** Do not add Google Analytics, GTM, or any third-party scripts unless the user explicitly asks.