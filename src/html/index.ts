import { readFile } from "node:fs/promises";
import type { Nodes, Comment } from "hast";
import { parse } from "parse5";
import { fromParse5 } from "hast-util-from-parse5";
import { visit } from "unist-util-visit";
import type { Citation } from "../interface";
import { fromAcc, register } from "./rules";
import type { Acc } from "./rules";
import { applyAdapters } from "./adapters";
import { setupRules } from "./setupRules";
import { setupAdapters } from "./setupAdapters";
import { registerTests, testLDgraph, testMeta, test } from "./testers";
import { getLog } from "../log";

const priority = setupRules(4);
setupAdapters();

function parseComment(strs: string[]) {
  let acc: { [key: string]: string } = {};
  for (let str of strs) {
    const ndx = str.indexOf(":");
    if (ndx >= 0) {
      const key = str.slice(0, ndx);
      const value = str.slice(ndx + 2);
      if (value) acc[key] = value;
    }
  }
  return acc;
}

function singleFile(priority: number, acc: Acc, node: Comment) {
  const value = node.value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const first = value.shift();
  if (first === "Page saved with SingleFile") {
    const parsed = parseComment(value);
    getLog() &&
      console.log("URL", priority, { singleFile: "url" }, parsed["url"]);
    register(acc, "URL", priority + 1, parsed["url"]);
    getLog() &&
      console.log(
        "archived",
        priority,
        { singleFile: "saved date" },
        parsed["saved date"]
      );
    register(acc, "archived", priority + 1, parsed["saved date"]);
    return true;
  }
}

function readMeta(tree: Nodes): Partial<Citation> {
  const acc: Acc = { citation: {} };
  visit(tree, (node) => {
    if (node.type === "comment") {
      singleFile(priority + 1, acc, node);
      return;
    }
    if (node.type === "element") {
      registerTests(priority + 1, acc, node) ||
        test("title", 0, { select: { tagName: "h1" } }, acc, node) ||
        testMeta(acc, node) ||
        test(
          "URL",
          1,
          {
            select: {
              tagName: "link",
              attr: "rel",
              value: "canonical",
            },
            extract: "href",
          },
          acc,
          node
        ) ||
        test("URL", 2, { select: { tagName: "base" } }, acc, node) ||
        test("title", 3, { select: { tagName: "title" } }, acc, node) ||
        testLDgraph(priority, acc, node);
      return;
    }
  });
  const citation = applyAdapters(fromAcc(acc), acc.adapter, tree);
  if (!citation.source && citation.URL) {
    const { hostname } = new URL(citation.URL);
    const i = hostname.endsWith(".qc.ca") ? 3 : 2;
    citation.source = hostname.split(".").at(-i);
  }
  return citation;
}

function parseTree(raw: string) {
  const ast = parse(raw);
  const tree = fromParse5(ast);
  return tree;
}

export async function citationFromHTML(
  filename: string
): Promise<Partial<Citation>> {
  const raw = await readFile(filename, "utf-8");
  const tree = parseTree(raw);
  return readMeta(tree);
}
