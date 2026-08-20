const markdownIt = require("markdown-it");

module.exports = function (eleventyConfig) {
  // =========================================================
  // SITE CONFIGURATION
  // =========================================================

  const sitePrefix = "/obsidian-sites";

  // =========================================================
  // MARKDOWN
  // =========================================================

  const md = markdownIt({
    html: true,
    linkify: true
  });

  eleventyConfig.setLibrary("md", md);

  // =========================================================
  // HELPERS
  // =========================================================

  function slugify(value) {
    return String(value)
      .trim()
      .toLowerCase()
      .replace(/['’]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function normalizeTag(tag) {
    return String(tag)
      .trim()
      .toLowerCase()
      .replace(/^#/, "")
      .replace(/^["']|["']$/g, "");
  }

  function getTags(item) {
    if (!item || !item.data || !item.data.tags) {
      return [];
    }

    const tags = Array.isArray(item.data.tags)
      ? item.data.tags
      : [item.data.tags];

    return tags
      .map(normalizeTag)
      .filter(Boolean);
  }

  function isPost(item) {
    return getTags(item).includes("posts");
  }

  function isNote(item) {
    return getTags(item).includes("notes");
  }

  function isPublished(item) {
    return isPost(item) || isNote(item);
  }

  function extractInlineTags(content) {
    if (!content || typeof content !== "string") {
      return [];
    }

    const matches =
      content.match(
        /(^|[\s>])#([a-zA-Z0-9_-]+)/g
      ) || [];

    return matches
      .map((match) => {
        const found = match.match(
          /#([a-zA-Z0-9_-]+)/
        );

        return found
          ? found[1].toLowerCase()
          : null;
      })
      .filter(Boolean);
  }

  function normalizeNoteName(name) {
    return String(name)
      .trim()
      .toLowerCase()
      .replace(/\.md$/i, "");
  }

  function getAllTags(item) {
    const tags = new Set();

    getTags(item).forEach((tag) => {
      if (tag !== "posts" && tag !== "notes") {
        tags.add(tag);
      }
    });

    const raw =
      typeof item?.rawInput === "string"
        ? item.rawInput
        : "";

    extractInlineTags(raw).forEach((tag) => {
      if (tag !== "posts" && tag !== "notes") {
        tags.add(tag);
      }
    });

    return Array.from(tags);
  }

  // =========================================================
  // BASIC FILTERS
  // =========================================================

  eleventyConfig.addFilter(
    "isPost",
    function (item) {
      return isPost(item);
    }
  );

  eleventyConfig.addFilter(
    "isNote",
    function (item) {
      return isNote(item);
    }
  );

  eleventyConfig.addFilter(
    "isPublished",
    function (item) {
      return isPublished(item);
    }
  );

  eleventyConfig.addFilter(
    "urlencode",
    function (value) {
      return encodeURIComponent(String(value));
    }
  );

  // =========================================================
  // FILTER BY TAG
  // =========================================================

  eleventyConfig.addFilter(
    "filterByTag",
    function (collection, tag) {
      if (!Array.isArray(collection)) {
        return [];
      }

      const normalizedTag = normalizeTag(tag);

      return collection.filter((item) => {
        return getAllTags(item).includes(
          normalizedTag
        );
      });
    }
  );

  // =========================================================
  // INLINE TAGS
  // =========================================================

  eleventyConfig.addFilter(
    "inlineTags",
    function (content) {
      if (!content || typeof content !== "string") {
        return content || "";
      }

      return content.replace(
        /(^|[\s>])#([a-zA-Z0-9_-]+)/g,
        (match, prefix, tag) => {
          const tagName = tag.toLowerCase();

          return (
            `${prefix}` +
            `<a href="${sitePrefix}/tags/${encodeURIComponent(tagName)}/"` +
            ` class="text-blue-400 hover:text-white underline">` +
            `#${tag}` +
            `</a>`
          );
        }
      );
    }
  );

  // =========================================================
  // WIKI LINKS
  // =========================================================

  eleventyConfig.addFilter(
    "wikilinks",
    function (content) {
      if (!content || typeof content !== "string") {
        return content || "";
      }

      return content.replace(
        /\[\[([^\]|#]+)(?:\|([^\]]+))?\]\]/g,
        (match, target, display) => {
          const name = target.trim();

          const text = display
            ? display.trim()
            : name;

          const slug = slugify(name);

          return (
            `<a href="${sitePrefix}/notes/${slug}/"` +
            ` class="text-blue-400 hover:text-white underline">` +
            `${text}` +
            `</a>`
          );
        }
      );
    }
  );

  // =========================================================
  // AUTO LINKS
  // =========================================================

  eleventyConfig.addFilter(
    "autoLinks",
    function (content) {
      if (!content || typeof content !== "string") {
        return content || "";
      }

      let result = content;

      // -------------------------------------------------------
      // Wiki links
      // -------------------------------------------------------

      result = result.replace(
        /\[\[([^\]|#]+)(?:\|([^\]]+))?\]\]/g,
        (match, target, display) => {
          const name = target.trim();

          const text = display
            ? display.trim()
            : name;

          const slug = slugify(name);

          return (
            `<a href="${sitePrefix}/notes/${slug}/"` +
            ` class="text-blue-400 hover:text-white underline">` +
            `${text}` +
            `</a>`
          );
        }
      );

      // -------------------------------------------------------
      // Hashtags
      // -------------------------------------------------------

      result = result.replace(
        /(^|[\s>])#([a-zA-Z0-9_-]+)/g,
        (match, prefix, tag, offset, wholeString) => {
          const before = wholeString.slice(
            Math.max(0, offset - 30),
            offset
          );

          if (
            before.includes("href=") ||
            before.includes("<a ")
          ) {
            return match;
          }

          const tagName = tag.toLowerCase();

          return (
            `${prefix}` +
            `<a href="${sitePrefix}/tags/${encodeURIComponent(tagName)}/"` +
            ` class="text-blue-400 hover:text-white underline">` +
            `#${tag}` +
            `</a>`
          );
        }
      );

      // -------------------------------------------------------
      // HTTP / HTTPS links
      // -------------------------------------------------------

      result = result.replace(
        /(^|[\s>])(https?:\/\/[^\s<]+)/g,
        (match, prefix, url) => {
          let cleanUrl = url;
          let trailing = "";

          while (
            /[.,!?;:)\]}]$/.test(cleanUrl)
          ) {
            trailing =
              cleanUrl.slice(-1) +
              trailing;

            cleanUrl =
              cleanUrl.slice(0, -1);
          }

          const escapedUrl =
            cleanUrl
              .replace(/&/g, "&amp;")
              .replace(/"/g, "&quot;");

          return (
            `${prefix}` +
            `<a href="${escapedUrl}"` +
            ` class="text-blue-400 hover:text-white underline"` +
            ` target="_blank"` +
            ` rel="noopener noreferrer">` +
            `${cleanUrl}` +
            `</a>` +
            trailing
          );
        }
      );

      return result;
    }
  );

  // =========================================================
  // POSTS COLLECTION
  // =========================================================

  eleventyConfig.addCollection(
    "posts",
    function (collectionApi) {
      return collectionApi
        .getAll()
        .filter((item) => {
          if (!item.inputPath) {
            return false;
          }

          if (!item.inputPath.endsWith(".md")) {
            return false;
          }

          return isPost(item);
        });
    }
  );

  // =========================================================
  // NOTES COLLECTION
  // =========================================================

  eleventyConfig.addCollection(
    "notes",
    function (collectionApi) {
      return collectionApi
        .getAll()
        .filter((item) => {
          if (!item.inputPath) {
            return false;
          }

          if (!item.inputPath.endsWith(".md")) {
            return false;
          }

          return isNote(item);
        });
    }
  );

  // =========================================================
  // ALL PUBLISHED CONTENT
  // =========================================================

  eleventyConfig.addCollection(
    "published",
    function (collectionApi) {
      return collectionApi
        .getAll()
        .filter((item) => {
          if (!item.inputPath) {
            return false;
          }

          if (!item.inputPath.endsWith(".md")) {
            return false;
          }

          return isPublished(item);
        });
    }
  );

  // =========================================================
  // TAG LIST
  // =========================================================

  eleventyConfig.addCollection(
    "tagList",
    function (collectionApi) {
      const tags = new Set();

      collectionApi
        .getAll()
        .filter((item) => {
          if (!item.inputPath) {
            return false;
          }

          if (!item.inputPath.endsWith(".md")) {
            return false;
          }

          return isPublished(item);
        })
        .forEach((item) => {
          getAllTags(item).forEach((tag) => {
            tags.add(tag);
          });
        });

      return Array.from(tags).sort();
    }
  );

  // =========================================================
  // TAG PAGES
  // =========================================================

  eleventyConfig.addCollection(
    "tagPages",
    function (collectionApi) {
      const tags = new Set();

      collectionApi
        .getAll()
        .filter((item) => {
          if (!item.inputPath) {
            return false;
          }

          if (!item.inputPath.endsWith(".md")) {
            return false;
          }

          return isPublished(item);
        })
        .forEach((item) => {
          getAllTags(item).forEach((tag) => {
            tags.add(tag);
          });
        });

      return Array.from(tags).sort();
    }
  );

  // =========================================================
  // BACKLINKS
  // =========================================================

  eleventyConfig.addFilter(
    "backlinks",
    function (currentPage, collection) {
      if (
        !currentPage ||
        !Array.isArray(collection)
      ) {
        return [];
      }

      const currentName =
        normalizeNoteName(
          currentPage.fileSlug ||
          currentPage.data?.title ||
          ""
        );

      const backlinks = [];

      collection.forEach((page) => {
        if (
          !page ||
          !page.data ||
          !page.inputPath
        ) {
          return;
        }

        if (!isPublished(page)) {
          return;
        }

        const raw =
          typeof page.rawInput === "string"
            ? page.rawInput
            : "";

        const matches =
          raw.match(
            /\[\[([^\]|#]+)(?:\|[^\]]+)?\]\]/g
          ) || [];

        matches.forEach((link) => {
          const match =
            link.match(
              /\[\[([^\]|#]+)/
            );

          if (!match) {
            return;
          }

          const linkedName =
            normalizeNoteName(match[1]);

          if (
            linkedName === currentName &&
            !backlinks.includes(page)
          ) {
            backlinks.push(page);
          }
        });
      });

      return backlinks;
    }
  );

  // =========================================================
  // PERMALINKS
  // =========================================================

  eleventyConfig.addGlobalData("eleventyComputed", {
    permalink: (data) => {
      if (data.permalink && typeof data.permalink === "string") {
        return data.permalink;
      }

      if (
        !data.page ||
        !data.page.inputPath ||
        !data.page.inputPath.endsWith(".md")
      ) {
        return false;
      }

      const tags = Array.isArray(data.tags)
        ? data.tags
        : data.tags
          ? [data.tags]
          : [];

      const published = tags
        .map(normalizeTag)
        .some((tag) => tag === "posts" || tag === "notes");

      if (!published) {
        return false;
      }

      return `/notes/${slugify(data.page.fileSlug)}/`;
    }
  });

  // =========================================================
  // IGNORE NON-SITE FILES
  // =========================================================

  eleventyConfig.ignores.add(
    "obsidian-vault/**"
  );

  eleventyConfig.ignores.add(
    "node_modules/**"
  );

  eleventyConfig.ignores.add(
    "_site/**"
  );

  eleventyConfig.ignores.add(
    "_test-site/**"
  );

  eleventyConfig.ignores.add(
    "backup-obsidian.sh"
  );

  eleventyConfig.ignores.add(
    "publish-site.sh"
  );

  eleventyConfig.ignores.add(
    "package.json"
  );

  eleventyConfig.ignores.add(
    "package-lock.json"
  );

  eleventyConfig.ignores.add(
    ".gitignore"
  );

  eleventyConfig.ignores.add(
    ".eleventy.js"
  );

  eleventyConfig.ignores.add(
    "content/notes/index.md"
  );

  // =========================================================
  // DIRECTORY CONFIGURATION
  // =========================================================

  return {
    pathPrefix: "/obsidian-sites/",

    dir: {
      input: "src",
      includes: "_includes",
      output: "_site"
    },

    markdownTemplateEngine: "liquid",

    templateFormats: [
      "md",
      "njk"
    ]
  };
};