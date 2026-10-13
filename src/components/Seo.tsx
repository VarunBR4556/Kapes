import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const BASE_URL = "https://kapes-app.vercel.app";
const DEFAULT_DESCRIPTION =
  "Kapes connects drivers with unused vehicle capacity to customers who need shipping space. Find available space by route, book it in minutes, and move cargo across India.";
const INDEX_ROBOTS = "index, follow, max-image-preview:large";
const NOINDEX_ROBOTS = "noindex, nofollow";

interface RouteMeta {
  title: string;
  description: string;
  index: boolean;
}

const ROUTE_META: { test: (path: string) => boolean; meta: RouteMeta }[] = [
  {
    test: (path) => path === "/",
    meta: {
      title: "Kapes — Vehicle Capacity Marketplace | Ship Space on Vehicles",
      description: DEFAULT_DESCRIPTION,
      index: true,
    },
  },
  {
    test: (path) => path === "/trips",
    meta: {
      title: "Find Available Vehicle Capacity & Cargo Space — Kapes",
      description:
        "Browse live trips with spare capacity. Search by pickup city, drop-off city and date, then book the exact space your cargo needs on Kapes.",
      index: true,
    },
  },
];

const PRIVATE_META: RouteMeta = {
  title: "Kapes — Vehicle Capacity Marketplace",
  description: DEFAULT_DESCRIPTION,
  index: false,
};

function upsertMeta(attribute: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attribute, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertCanonical(href: string) {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", href);
}

const Seo = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const matched = ROUTE_META.find((route) => route.test(pathname));
    const meta = matched ? matched.meta : PRIVATE_META;
    const url = `${BASE_URL}${pathname === "/" ? "/" : pathname}`;

    document.title = meta.title;
    upsertMeta("name", "description", meta.description);
    upsertMeta("name", "robots", meta.index ? INDEX_ROBOTS : NOINDEX_ROBOTS);
    upsertMeta("property", "og:title", meta.title);
    upsertMeta("property", "og:description", meta.description);
    upsertMeta("property", "og:url", url);
    upsertCanonical(url);
  }, [pathname]);

  return null;
};

export default Seo;
