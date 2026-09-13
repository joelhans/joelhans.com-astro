# [joelhans.com](https://joelhans.com)

My little home on the internet, with room for fiction and tech. Built with Astro, MDX, and Tailwind.

https://github.com/user-attachments/assets/483b6fc9-b41f-41ca-a12f-7fc51553efed

- [The homepage](src/pages/index.astro) shows both bios and each side’s latest thought. Home and Contact stay neutral.
- [Header](src/components/Header.astro) shows navigation for the selected side. [PathMark](src/components/PathMark.astro) supplies the curved fiction line and stepped tech line.
- [site-mode.ts](src/scripts/site-mode.ts) coordinates Astro’s client router, mode selection, page fades, and line drawing. It respects reduced motion and browser history.
- [ReadingLink](src/components/ReadingLink.astro) keeps titles and dates consistent between the homepage and Thoughts index.
- [MDX posts](src/content/blog) use frontmatter to select fiction or tech. [BlogPost](src/layouts/BlogPost.astro) provides the reading layout and a return link to that side’s Thoughts index.
