import { binder } from "./binder/manifest";
import { board } from "./board/manifest";
import { spread } from "./spread/manifest";
import type { SetId, SetManifest } from "./contract";

export const registry: Record<SetId, SetManifest> = { binder, board, spread };
