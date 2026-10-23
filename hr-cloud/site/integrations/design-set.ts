import type { AstroIntegration } from "astro";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { FINISHES, SET_COMPONENTS, SET_IDS, validateManifest, type Finish, type SetId } from "../src/design-sets/contract";
import { registry } from "../src/design-sets/registry";

async function writeIfChanged(path: string, text: string) {
  const old = await readFile(path, "utf8").catch(() => "");
  if (old !== text) await writeFile(path, text);
}

export default function designSet(opts: { set: string; finish: string; inspect: boolean }): AstroIntegration {
  return {
    name: "decision-desk:design-set",
    hooks: {
      "astro:config:setup": async ({ config, logger }) => {
        if (!SET_IDS.includes(opts.set as SetId))
          throw new Error(`design.designSet が不明: ${opts.set}（binder / board / spread）`);
        if (!FINISHES.includes(opts.finish as Finish))
          throw new Error(`design.finish が不明: ${opts.finish}（flat / real）`);
        const m = registry[opts.set as SetId];
        const errors = validateManifest(m);
        if (errors.length) throw new Error(`manifest の検査に失敗:\n- ${errors.join("\n- ")}`);

        const root = fileURLToPath(config.root);
        const dir = `${root}src/design-sets/${m.id}/`;
        const need = ["tokens.css", "parts.css", m.finishes.real, ...SET_COMPONENTS.map((c) => `components/${c}.astro`)];
        for (const f of need)
          await access(dir + f).catch(() => {
            throw new Error(`セット ${m.id} に ${f} がない`);
          });

        const css = [
          "/* 自動生成：編集しない（integrations/design-set.ts） */",
          `@import "../design-sets/${m.id}/tokens.css";`,
          `@import "../design-sets/${m.id}/parts.css";`,
          ...(opts.finish === "real" ? [`@import "../design-sets/${m.id}/${m.finishes.real}";`] : []),
          ...(opts.inspect ? [`@import "../styles/inspect.css";`] : []),
          "",
        ].join("\n");
        const ui = [
          "// 自動生成：編集しない（integrations/design-set.ts）",
          ...SET_COMPONENTS.map((c) => `export { default as ${c} } from "../design-sets/${m.id}/components/${c}.astro";`),
          `export const DESIGN = { set: "${m.id}", finish: "${opts.finish}" } as const;`,
          "",
        ].join("\n");

        await mkdir(`${root}src/generated`, { recursive: true });
        await writeIfChanged(`${root}src/generated/design.css`, css);
        await writeIfChanged(`${root}src/generated/ui.ts`, ui);
        logger.info(`designSet=${m.id} finish=${opts.finish}${opts.inspect ? " inspect=on" : ""}`);
      },
    },
  };
}
