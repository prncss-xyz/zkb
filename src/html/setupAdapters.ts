import { toText, getAttr, hasClass } from "./utils";
import type { Citation } from "../interface";
import { setupAdapter } from "./adapters";
import type { Element } from "hast";
import { visit } from "unist-util-visit";

function IEPAuthors(tree: Element) {
  const ret: string[] = [];
  let inp = false;
  for (const children of tree.children) {
    if (children.type !== "element") return;
    if (!("value" in children.children?.[0])) return;
    const value = children.children[0].value;
    if (children.tagName === "h3") {
      if (value === "Author Information") {
        inp = true;
      }
      continue;
    }
    if (inp && children.tagName === "p") {
      ret.push(value);
    }
  }
  if (ret.length > 0) return ret;
}

export function setupAdapters() {
  setupAdapter({
    pattern: "iep.utm.edu",
    citation: {
      type: "article",
      publisher: "Internet Encyclopedia of Phylosophy",
      source: "IEP",
    },
    splitTitle: "|",
    cb: (tree) => {
      const res: Partial<Citation> = {};
      visit(tree, (node) => {
        if (node.type !== "element") return;
        if (hasClass("entry-content", node)) {
          res.authors = IEPAuthors(node);
        }
      });
      return res;
    },
  });
  setupAdapter({
    pattern: "histoireengagee.ca",
    citation: {
      type: "magazine",
      language: "fr",
    },
    tests: [
      {
        field: "authors",
        critaria: (node) => {
          if (node.tagName === "a" && node.properties?.rel === "category tag") {
            const href = getAttr("href", node);
            if (href && href.match(/collaborat/)) {
              return toText(node);
            }
          }
        },
      },
    ],
  });
  setupAdapter({
    pattern: "plato.stanford.edu",
    citation: {
      type: "article",
      source: "SEP",
    },
  });
  setupAdapter({
    pattern: "signosemio.com",
    citation: {
      publisher: "Signo",
      type: "blog",
      language: "fr",
    },
  });
  setupAdapter({
    pattern: "cairn.info",
    citation: {
      language: "fr",
      type: "article",
    },
  });
  setupAdapter({
    pattern: "radio-canada.ca",
    citation: {
      type: "news",
      language: "fr",
    },
  });
  setupAdapter({
    pattern: "wikipedia.org",
    citation: {
      authors: ["Wikipedia"],
      type: "wiki",
    },
    splitTitle: "-",
  });
  setupAdapter({
    pattern: "psychologytoday.com",
    citation: {
      type: "magazine",
    },
  });
  setupAdapter({
    pattern: "academic.oup.com",
    citation: {
      type: "article",
      publisher: "Oxford University Press",
    },
  });
}
