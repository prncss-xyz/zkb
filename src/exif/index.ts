import { spawn } from "node:child_process";
import { getLog } from "../log";
import type { Citation } from "../interface";

function parseDate(str: unknown) {
  if (!str) return;
  if (typeof str !== "string") return;
  const words = str.split(" ");
  words[0] = words[0].replace(/:/g, "-");
  return words.join(" ");
}

function parseStr(str: unknown) {
  if (!str) return;
  if (typeof str !== "string") return;
  return str;
}

function getMetaExiftool(
  filename: string
): Promise<{ [key: string]: unknown }> {
  let stdout = "";
  let stderr = "";
  return new Promise((resolve, reject) => {
    const proc = spawn("exiftool", ["-json", filename]);

    proc.stdout.on("data", (data) => {
      stdout += data;
    });

    proc.stderr.on("data", (data) => {
      stderr += data;
    });

    proc.on("close", (code) => {
      if (code === 0) {
        const json = JSON.parse(stdout);
        const res = json[0];
        resolve(res as { [key: string]: string });
      } else {
        reject({
          code: "ERR_EXIF",
          no: code,
          message: stderr,
        });
      }
    });
  });
}

export async function citationFromEXIF(
  filename: string
): Promise<Partial<Citation>> {
  const res = await getMetaExiftool(filename);
  const author = parseStr(res["Author"]);
  const authors = author ? [author] : undefined;
  const issued = parseDate(res["CreateDate"]);
  const modified = parseDate(res["FileModifyDate"]);
  const title = parseStr(res["Title"]);
  getLog() && console.log(res);
  return {
    issued,
    modified,
    title,
    authors,
  };
}
