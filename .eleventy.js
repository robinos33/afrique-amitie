module.exports = function (eleventyConfig) {
  // Copie directe des assets statiques (images, favicon, etc.) vers _site/
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });


  // Raccourci {% year %} pour afficher l'année courante (utile dans le footer)
  eleventyConfig.addShortcode("year", () => `${new Date().getFullYear()}`);

  // Filtre de date en français
  eleventyConfig.addFilter("dateF", (date) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  });

  // Filtre ISO 8601 pour le sitemap
  eleventyConfig.addFilter("isoDate", (date) => {
    return new Date(date).toISOString().split("T")[0];
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      layouts: "_includes/layouts",
    },
    // Templates par défaut
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["njk", "md", "html"],
  };
};
