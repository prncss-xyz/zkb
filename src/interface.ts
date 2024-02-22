export interface Citation {
  authors: string[];
  URL: string;
  issued: string;
  modified: string;
  archived: string;
  title: string;
  language: string;
  publisher: string;
  description: string;
  type: string;
  firstPage: string;
  lastPage: string;
  doi: string;
  source: string;
  journalAbbrev: string;
}

export const plFields: PlField[] = ["authors"];
export const sgFields: SgField[] = [
  "URL",
  "issued",
  "modified",
  "archived",
  "title",
  "language",
  "publisher",
  "description",
  "type",
  "firstPage",
  "lastPage",
  "doi",
  "source",
  "journalAbbrev",
];

export function isSgField(field: Field): field is SgField {
  return (sgFields as Field[]).includes(field);
}

export function isPlField(field: Field): field is PlField {
  return (plFields as Field[]).includes(field);
}
export type Field = keyof Citation;

export type SgField = {
  [K in keyof Citation]: Citation[K] extends string | undefined ? K : never;
}[keyof Citation];

export type PlField = {
  [K in keyof Citation]: Citation[K] extends string[] | undefined ? K : never;
}[keyof Citation];
