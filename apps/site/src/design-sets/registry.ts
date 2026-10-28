import { tally } from "./tally/manifest";
import { answer } from "./answer/manifest";
import { figure } from "./figure/manifest";
import { inline } from "./inline/manifest";
import type { SetId, SetManifest } from "./contract";

export const registry: Record<SetId, SetManifest> = { tally, answer, figure, inline };
