# [joelhans.com](https://joelhans.com)

My little home on the internet, with room for fiction and tech. Built with Astro, MDX, and Tailwind.

[![Watch the homepage and fiction/tech switcher in action](docs/media/homepage-preview.png)](docs/media/homepage.mp4)

[Watch the 16-second walkthrough (MP4)](docs/media/homepage.mp4): both bios, then the changing colors, content, and drawn lines.

- [The homepage](src/pages/index.astro) shows both bios and each side’s latest thought. Home and Contact stay neutral.
- [Header](src/components/Header.astro) shows navigation for the selected side. [PathMark](src/components/PathMark.astro) supplies the curved fiction line and stepped tech line.
- [site-mode.ts](src/scripts/site-mode.ts) coordinates Astro’s client router, mode selection, page fades, and line drawing. It respects reduced motion and browser history.
- [ReadingLink](src/components/ReadingLink.astro) keeps titles and dates consistent between the homepage and Thoughts index.
- [MDX posts](src/content/blog) use frontmatter to select fiction or tech. [BlogPost](src/layouts/BlogPost.astro) provides the reading layout and a return link to that side’s Thoughts index.
