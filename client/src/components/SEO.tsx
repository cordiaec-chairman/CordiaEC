import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

export default function SEO({
  title,
  description,
  image,
  url,
  type = "website",
}: SEOProps) {
  useEffect(() => {
    // 1. Title 업데이트
    const defaultTitle = "지구촌한인세상 꼬르디아 | Cordia - 글로벌 한인 디아스포라 네트워크";
    const fullTitle = title ? `${title} | 지구촌한인세상 꼬르디아 (CordiaEC)` : defaultTitle;
    document.title = fullTitle;

    // 헬퍼: 메타태그 생성 또는 업데이트
    const updateMeta = (selector: string, attr: "name" | "property", key: string, content?: string) => {
      if (!content) return;
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    // 2. Meta description
    if (description) {
      updateMeta('meta[name="description"]', "name", "description", description);
      updateMeta('meta[property="og:description"]', "property", "og:description", description);
      updateMeta('meta[name="twitter:description"]', "name", "twitter:description", description);
    }

    // 3. OpenGraph / Twitter Title
    updateMeta('meta[property="og:title"]', "property", "og:title", fullTitle);
    updateMeta('meta[name="twitter:title"]', "name", "twitter:title", fullTitle);

    // 4. Image
    const targetImage = image || "https://k-dia.net/og-image.png";
    updateMeta('meta[property="og:image"]', "property", "og:image", targetImage);
    updateMeta('meta[name="twitter:image"]', "name", "twitter:image", targetImage);

    // 5. URL
    if (url) {
      updateMeta('meta[property="og:url"]', "property", "og:url", url);
      let canonical = document.querySelector('link[rel="canonical"]');
      if (canonical) {
        canonical.setAttribute("href", url);
      }
    }

    // 6. Type
    if (type) {
      updateMeta('meta[property="og:type"]', "property", "og:type", type);
    }
  }, [title, description, image, url, type]);

  return null;
}
