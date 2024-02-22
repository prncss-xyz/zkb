import type { Element } from "hast";
import { toText } from "hast-util-to-text";
import type { Field } from "../interface";
import { register, applyRules, Acc } from "./rules";
import { getAttr, hasClass } from "./utils";
import { getLog } from "../log";

interface Select {
  tagName?: string;
  className?: string;
  attr?: string;
  value?: string;
}

type Test =
  | {
      select: Select;
      extract?: string;
    }
  | ((node: Element) => string | undefined);

function applyTest(critaria: Test, node: Element): string {
  if (typeof critaria === "function") {
    return critaria(node) ?? "";
  }
  const { select, extract } = critaria;
  if (select.tagName && node.tagName !== select.tagName) return "";
  if (select.attr) {
    const p = getAttr(select.attr, node);
    if (!p) return "";
    if (select.value && extract !== select.value) return "";
  }
  if (select.className) {
    if (!hasClass(select.className, node)) return "";
  }
  if (extract) {
    const res = node.properties?.[extract];
    if (typeof res === "string") return res;
    return "";
  }
  return toText(node);
}

export function test(
  field: Field,
  priority: number,
  critaria: Test,
  acc: Acc,
  node: Element
) {
  const value = applyTest(critaria, node);
  if (value) {
    getLog() && console.log(field, priority, critaria, value);
    register(acc, field, priority, value);
    return true;
  }
  return false;
}

export interface ITest {
  field: Field;
  critaria: Test;
}

export function registerTests(priority: number, acc: Acc, node: Element) {
  const tests = acc.adapter?.tests;
  if (!tests) return false;
  for (const { field, critaria } of tests) {
    if (test(field, priority, critaria, acc, node)) return true;
  }
}

function registerLDgraph(priority: number, acc: Acc, raw: string) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {}
  if (!parsed) return;
  const graph = parsed?.["@graph"]?.[0];
  if (!graph) return;
  if (getLog()) {
    graph.url && console.log("URL", priority, "LDGraph", graph.url);
    graph.author?.name &&
      console.log("authors", "LDGraph", priority, graph.author?.name);
    graph.datePublished &&
      console.log("issued", "LDGraph", priority, graph.datePublished);
    graph.dateModified &&
      console.log("modified", "LDGraph", priority, graph.dateModified);
  }
  register(acc, "URL", priority, graph.url);
  register(acc, "authors", priority, graph.author?.name);
  register(acc, "issued", priority, graph.datePublished);
  register(acc, "modified", priority, graph.dateModified);
}

export function testLDgraph(priority: number, acc: Acc, node: Element) {
  const LDgraph = applyTest(
    {
      select: {
        tagName: "script",
        attr: "type",
        value: "application/ld+json",
      },
    },
    node
  );
  if (LDgraph) {
    registerLDgraph(priority, acc, LDgraph);
    return true;
  }
  return false;
}

export function testMeta(acc: Acc, node: Element) {
  if (node.tagName !== "meta") return;
  let key = node.properties.name ?? node.properties.property;
  const value = node.properties.content;
  if (typeof key === "string" && typeof value === "string") {
    key = key.toLowerCase();
    applyRules(acc, key, value);
  }
  return true;
}
