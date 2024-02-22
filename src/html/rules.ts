import { type Citation, type Field, isSgField, isPlField } from "../interface";
import { getAdapter } from "./adapters";
import type { Adapter } from "./adapters";
import { getLog } from "../log";

export type Acc = {
  adapter?: Adapter;
  citation: Partial<CitationAcc>;
};

type SgFieldAcc =
  | {
      priority: number;
      value: string;
    }
  | undefined;

type PlFieldAcc =
  | {
      priority: number;
      values: string[];
    }
  | undefined;

export type CitationAcc = {
  [K in keyof Citation]: Citation[K] extends string | undefined
    ? SgFieldAcc
    : PlFieldAcc;
};

let counter: number;

const rules = new Map<string, { priority: number; field: Field }>();

export function initCounter(value: number) {
  counter = value;
}

export function getCounter() {
  return counter;
}

export function setupRule(field: Field, key: string) {
  const priority = ++counter;
  rules.set(key, {
    priority,
    field,
  });
}

export function applyRules(acc: Acc, key: string, value: string) {
  const rule = rules.get(key);
  if (!rule) return;
  const { priority, field } = rule;
  getLog() && console.log(field, priority, { meta: key }, value);
  register(acc, field, priority, value);
}

export function register(
  acc: Acc,
  field: Field,
  priority: number,
  value: unknown
) {
  if (typeof value !== "string") return;
  if (!value) return;
  if (isSgField(field)) {
    const f = acc.citation[field];
    if (f && f.priority >= priority) return;
    acc.citation[field] = { priority, value };
    if (field === "URL") {
      acc.adapter = getAdapter(value);
    }
    return;
  }
  if (isPlField(field)) {
    const f = acc.citation[field];
    if (f && f.priority > priority) return;
    const values = f && f.priority === priority ? f.values : [];
    values.push(value);
    acc.citation[field] = { priority, values };
    return;
  }
  throw new Error("unexpected field name: " + field);
}

export function fromAcc(acc: Acc): Partial<Citation> {
  return {
    authors: acc.citation.authors?.values,
    URL: acc.citation.URL?.value,
    issued: acc.citation.issued?.value,
    modified: acc.citation.modified?.value,
    archived: acc.citation.archived?.value,
    title: acc.citation.title?.value,
    language: acc.citation.language?.value,
    publisher: acc.citation.publisher?.value,
    description: acc.citation.description?.value,
    type: acc.citation.type?.value,
    firstPage: acc.citation.firstPage?.value,
    lastPage: acc.citation.lastPage?.value,
    doi: acc.citation.doi?.value,
    source: acc.citation.source?.value,
    journalAbbrev: acc.citation.journalAbbrev?.value,
  };
}
