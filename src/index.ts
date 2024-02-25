import { program } from "commander";
import matter from "gray-matter";
import { readFile, writeFile, appendFile } from "fs/promises";
import { execFile as execFile_ } from "child_process";
import { promisify } from "util";
import { basename, extname, relative, resolve, join } from "path";
import { citationFromEPUB } from "./epub";
import { citationFromHTML } from "./html";
import { citationFromEXIF } from "./exif";
import type { Citation } from "./interface";
import yaml from "js-yaml";
import { getLog, setLog } from "./log";

// __dirname points to ./dist
const fromSdr = __dirname + "/../from-sdr";

const execFile = promisify(execFile_);

async function getMeta(source: string) {
  let meta: Partial<Citation>;
  switch (extname(source)) {
    case ".epub":
      meta = await citationFromEPUB(source);
      break;
    case ".html":
      meta = await citationFromHTML(source);
      break;
    default:
      meta = await citationFromEXIF(source);
      break;
  }
  const archived = meta.archived && new Date(meta.archived);
  return { ...meta, archived };
}

async function meta(filename: string, opts: { log?: boolean }) {
  setLog(opts.log);
  const source = resolve(filename);
  const citation = await getMeta(source);
  // blank line to seperate output from logging
  getLog() && console.log();
  for (const [k, v] of Object.entries(citation))
    if (v !== undefined) console.log(k + ":", v);
}

async function create(filename: string, opts: { dir?: string }) {
  const dir = opts.dir || "inbox";
  const notebook = process.env["ZK_NOTEBOOK_DIR"] || "";
  const ext = extname(filename);
  const output = join(notebook, dir, basename(filename, ext) + ".md");
  const home = process.env["HOME"] || "";
  const asset = relative(home, filename);
  const citation = await getMeta(filename);
  const preamble = `---
${yaml.dump({
  asset,
  citation,
  type: "source",
})}
---
`;

  let stdout = "";
  try {
    const res = await execFile(fromSdr, [filename]);
    stdout = res.stdout;
  } catch (err) {
    // sinlently fails (nofile or parsing error)
  }
  await writeFile(output, preamble);
  await appendFile(output, stdout);
}

async function setType(type: string, filename: string) {
  try {
    const raw = await readFile(filename, "utf8");
    const { content, data } = matter(raw);
    data.type = type;
    await writeFile(
      filename,
      `---
${yaml.dump(data)}---
${content}`,
    );
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
    console.error(`file ${filename} does not exist`);
    process.exit(1);
  }
}

program
  .command("meta <filename>")
  .description("show metadata")
  .option("-l, --log", "log")
  .action(meta);

program
  .command("create <filename>")
  .description("create a note based on filename")
  .option("-d, --dir <div>", "dir")
  .action(create);

program
  .command("type <type> <filename>")
  .description("set note's type")
  .action(setType);

program.parseAsync(process.argv);
