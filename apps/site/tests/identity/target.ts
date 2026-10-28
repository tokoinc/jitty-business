// 識別検査のテストが見るセットと質感。書き出すファイル名に入るので、許可した値だけを通す。
import { FINISHES, SET_IDS, type Finish, type SetId } from "../../src/design-sets/contract";

function pick<T extends string>(name: string, value: string, allowed: readonly T[]): T {
  if (!(allowed as readonly string[]).includes(value)) {
    throw new Error(`${name} が不明: ${value}（${allowed.join(" / ")}）`);
  }
  return value as T;
}

export const set: SetId = pick("DD_DESIGN_SET", process.env.DD_DESIGN_SET ?? "tally", SET_IDS);
export const finish: Finish = pick("DD_FINISH", process.env.DD_FINISH ?? "flat", FINISHES);
