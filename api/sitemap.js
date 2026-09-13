// Dynamic sitemap generator connecting to Supabase
export default async function handler(req, res) {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    let posts = [];
    let initiatives = [];

    if (supabaseUrl && anonKey) {
      // 1. Fetch all posts
      try {
        const postsRes = await fetch(
          `${supabaseUrl}/rest/v1/posts?select=id,board,published_date,created_at&order=published_date.desc`,
          {
            headers: {
              apikey: anonKey,
              Authorization: `Bearer ${anonKey}`,
            },
          }
        );
        if (postsRes.ok) {
          posts = await postsRes.json();
        }
      } catch (e) {
        console.error("Failed to fetch posts for sitemap:", e);
      }

      // 2. Fetch all initiatives
      try {
        const initRes = await fetch(
          `${supabaseUrl}/rest/v1/initiatives?select=slug,display_order&order=display_order.asc`,
          {
            headers: {
              apikey: anonKey,
              Authorization: `Bearer ${anonKey}`,
            },
          }
        );
        if (initRes.ok) {
          initiatives = await initRes.json();
        }
      } catch (e) {
        console.error("Failed to fetch initiatives for sitemap:", e);
      }
    }

    const today = new Date().toISOString().split("T")[0];

    const staticRoutes = [
      { loc: "https://k-dia.net/", priority: "1.0", changefreq: "daily" },
      { loc: "https://k-dia.net/about", priority: "0.8", changefreq: "monthly" },
      { loc: "https://k-dia.net/initiatives", priority: "0.9", changefreq: "weekly" },
      { loc: "https://k-dia.net/reports", priority: "0.9", changefreq: "weekly" },
      { loc: "https://k-dia.net/overseas-korean", priority: "0.9", changefreq: "weekly" },
      { loc: "https://k-dia.net/news", priority: "0.9", changefreq: "weekly" },
      { loc: "https://k-dia.net/contact", priority: "0.7", changefreq: "monthly" },
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
    xml += `        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n`;

    // Static routes
    for (const route of staticRoutes) {
      xml += `  <url>\n`;
      xml += `    <loc>${route.loc}</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += `    <changefreq>${route.changefreq}</changefreq>\n`;
      xml += `    <priority>${route.priority}</priority>\n`;
      xml += `    <xhtml:link rel="alternate" hreflang="ko" href="${route.loc}"/>\n`;
      xml += `    <xhtml:link rel="alternate" hreflang="en" href="${route.loc}"/>\n`;
      xml += `  </url>\n`;
    }

    // Initiatives
    for (const init of initiatives) {
      if (!init.slug) continue;
      const url = `https://k-dia.net/initiatives/${init.slug}`;
      xml += `  <url>\n`;
      xml += `    <loc>${url}</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += `    <xhtml:link rel="alternate" hreflang="ko" href="${url}"/>\n`;
      xml += `    <xhtml:link rel="alternate" hreflang="en" href="${url}"/>\n`;
      xml += `  </url>\n`;
    }

    // Dynamic Posts (News, Reports, Diaspora)
    for (const post of posts) {
      if (!post.id) continue;
      let path = `/news/${post.id}`;
      if (post.board === "reports") path = `/reports/${post.id}`;
      if (post.board === "diaspora") path = `/overseas-korean/${post.id}`;

      const url = `https://k-dia.net${path}`;
      const postDate = post.published_date
        ? new Date(post.published_date).toISOString().split("T")[0]
        : today;

      xml += `  <url>\n`;
      xml += `    <loc>${url}</loc>\n`;
      xml += `    <lastmod>${postDate}</lastmod>\n`;
      xml += `    <changefreq>monthly</changefreq>\n`;
      xml += `    <priority>0.7</priority>\n`;
      xml += `    <xhtml:link rel="alternate" hreflang="ko" href="${url}"/>\n`;
      xml += `    <xhtml:link rel="alternate" hreflang="en" href="${url}"/>\n`;
      xml += `  </url>\n`;
    }

    xml += `</urlset>\n`;

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=600");
    return res.status(200).send(xml);
  } catch (err) {
    console.error("Sitemap generation error:", err);
    return res.status(500).send("Error generating sitemap");
  }
}
