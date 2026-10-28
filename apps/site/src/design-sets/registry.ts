import { binder } from "./binder/manifest";
import { board } from "./board/manifest";
import { spread } from "./spread/manifest";
import { tally } from "./tally/manifest";
import { answer } from "./answer/manifest";
import { figure } from "./figure/manifest";
import { inline } from "./inline/manifest";
import type { SetId, SetManifest } from "./contract";

export const registry: Record<SetId, SetManifest> = { binder, board, spread, tally, answer, figure, inline };
