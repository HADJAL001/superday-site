import { cp, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(process.cwd(), "..");
const web = resolve(process.cwd(), "www");
await rm(web, { recursive: true, force: true });
await mkdir(web, { recursive: true });
await cp(resolve(root, "app.html"), resolve(web, "index.html"));
await cp(resolve(root, "assets"), resolve(web, "assets"), { recursive: true });
await cp(resolve(root, "i18n"), resolve(web, "i18n"), { recursive: true });
