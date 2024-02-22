import * as unzipper from "unzipper";
import * as fs from "node:fs";
import { fromXml } from "xast-util-from-xml";
import { visit } from "unist-util-visit";
import type { Citation } from "./interface";

function streamToString(filename: string) {
  let first = true;
  const chunks = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(filename)
      .pipe(unzipper.Parse())
      .on("entry", function (entry) {
        const filename_ = entry.path;
        if (first && filename_.endsWith(".opf")) {
          first = false;
          // @ts-ignore
          entry.on("data", (chunk: any) => chunks.push(Buffer.from(chunk)));
          entry.on("error", (err: any) => reject(err));
          entry.on("end", () =>
            resolve(Buffer.concat(chunks).toString("utf8")),
          );
        } else {
          entry.autodrain();
        }
      });
  });
}

const value = (node: any) => node.children.find((c: any) => c.value).value;

export async function citationFromEPUB(filename: string): Promise<Citation> {
  let citation: Citation = { type: "book" };
  const raw: any = await streamToString(filename);
  const tree = fromXml(raw);
  visit(tree, (node: any) => {
    if (node.name === "metadata") {
      for (const child of node.children) {
        if (child.name === "dc:date") {
          citation.issued = value(child);
          continue;
        }
        if (child.name === "dc:title") {
          citation.title = value(child);
          continue;
        }
        if (child.name === "dc:language") {
          citation.language = value(child);
          continue;
        }
        if (child.name === "dc:publisher") {
          citation.publisher = value(child);
          continue;
        }
        if (child.name === "dc:creator") {
          citation.authors ??= [];
          citation.authors.push(value(child));
          continue;
        }
        if (child.name === "description") {
          citation.description = value(child);
          continue;
        }
      }
    }
  });
  return citation;
}
