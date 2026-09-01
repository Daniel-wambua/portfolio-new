# HavocSec · Daniel Wambua · Security Researcher

Personal portfolio for [HavocSec](https://portfolio.havocsec.me), offensive
security researcher and CTF practitioner. Dark, editorial, deliberately
restrained: typography, spacing and evidence carry the design.

**Live:** <https://portfolio.havocsec.me>

## What's on the page

- **Selected work**: glass cards in a two-column grid with cover images for
  the tools that run in production (BlackBook, docker-scanner, AIGCForge,
  cyberhub)
- **Research & writeups**: a live index of the latest CTF and pentest
  writeups, pulled from the feed and rendered as matching cards with
  platform, category, difficulty and feature image
- **Capabilities**: grounded in published work, not keyword lists
- **Track record**: bug bounty, seasonal HackTheBox machines, 2026 CTFs
- **Contact**: one email and a set of profile links

## Architecture

Static HTML/CSS/JS with no build step, deployed on Vercel straight from this
repository.

```
├── index.html          # the whole site
├── vercel.json         # deploy config: headers + the /rss.xml rewrite
├── favicon.svg
├── robots.txt
├── sitemap.xml
├── css/
│   └── style.css       # single stylesheet, one palette, one accent
├── js/
│   └── script.js       # nav drawer, scroll reveal, feed rendering
└── images/
    ├── og-image.png    # 1200×630 social card
    ├── profile-*.webp  # portrait, 1x/2x
    ├── guns-mask.webp  # alpha mask for the guns.lol icon
    └── projects/       # generated project covers for the work cards
```

## RSS

`https://portfolio.havocsec.me/rss.xml` is a **server-side rewrite** (see
`vercel.json`) to the live feed at `havocsec.dev/rss.xml`, so the portfolio
serves valid, always-fresh RSS under its own domain with no CORS involved.
The page announces it via RSS autodiscovery in `<head>`, and the writeup
index fetches the same same-origin URL. No proxies, no cached snapshots.

## Local development

```bash
git clone https://github.com/Daniel-wambua/portfolio-new.git
cd portfolio-new
python3 -m http.server 8080
```

Note: locally `/rss.xml` does not exist (the rewrite only runs on Vercel),
so the writeup index will fall back — and the browser will correctly refuse
the cross-origin direct fetch. The index renders fully once deployed.

## Contact

- **Blog:** [havocsec.dev](https://havocsec.dev)
- **GitHub:** [@Daniel-wambua](https://github.com/Daniel-wambua)
- **HackTheBox:** [profile](https://app.hackthebox.com/profile/2081158)
- **Email:** hello@havocsec.me

## License

MIT. See below.

<details>
<summary><strong>MIT License</strong></summary>

Copyright (c) 2026 Daniel Wambua

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

</details>
