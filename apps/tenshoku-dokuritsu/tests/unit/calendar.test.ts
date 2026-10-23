import { readFileSync } from "node:fs";
import { parse } from "yaml";
import { describe, expect, it } from "vitest";
import { evaluate, unfoldIcs, type CalendarInput, type CalendarRule } from "@/utils/calendar";

const rules = parse(
  readFileSync(new URL("../../src/data/calendar-rules.yaml", import.meta.url), "utf8"),
) as CalendarRule[];

function input(over: Partial<CalendarInput> = {}): CalendarInput {
  return {
    retirementDate: "2026-03-31",
    work: "independence",
    openingDate: "2026-04-01",
    joiningDate: null,
    insurance: "national",
    benefit: "decline",
    dc: "no",
    lossDateKnown: false,
    spouse: "no",
    ...over,
  };
}

function row(result: ReturnType<typeof evaluate>, id: string) {
  return result.find((item) => item.id === id);
}

describe("移行カレンダー", () => {
  it("開業日 2026-04-01 の開業届は翌年3月15日、青色申告は5月31日", () => {
    const result = evaluate(rules, input());
    const opening = row(result, "opening-notification");
    const twoMonths = row(result, "blue-return-two-months");
    expect(opening?.date).toBe("2027-03-15");
    expect(opening?.timing).toContain("法令等の期限");
    expect(opening?.timing).toContain("2027年3月15日");
    expect(opening?.timing).toContain("窓口で休日の扱いを確認する");
    expect(twoMonths?.date).toBe("2026-05-31");
    expect(twoMonths?.timing).toContain("2026年5月31日");
    expect(row(result, "blue-return-march-15")).toBeUndefined();
    expect(opening?.date).not.toBe("2026-05-01");
  });

  it("1月15日までの開業は、その年の3月15日で、日曜でもずらさない", () => {
    const result = evaluate(rules, input({ openingDate: "2026-01-10" }));
    const early = row(result, "blue-return-march-15");
    expect(early?.date).toBe("2026-03-15");
    expect(early?.timing).not.toContain("3月16日");
    expect(row(result, "blue-return-two-months")).toBeUndefined();
    expect(row(result, "opening-notification")?.date).toBe("2027-03-15");
  });

  it("1月16日の開業は、2月以内で3月15日になる", () => {
    const result = evaluate(rules, input({ openingDate: "2026-01-16" }));
    expect(row(result, "blue-return-two-months")?.date).toBe("2026-03-15");
    expect(row(result, "blue-return-march-15")).toBeUndefined();
  });

  it("応当日が無い月は、その月の末日の前日", () => {
    const result = evaluate(rules, input({ openingDate: "2023-12-31" }));
    expect(row(result, "blue-return-two-months")?.date).toBe("2024-02-28");
  });

  it("unverified のルールは date が null で、カレンダー追加も無い", () => {
    const result = evaluate(rules, input());
    const unverified = [
      "separation-reason",
      "market-value",
      "loan-card-account",
      "health-national",
      "pension-spouse",
      "tax-and-resident-tax",
    ];
    for (const id of unverified) {
      const item = row(result, id);
      expect(item, id).toBeDefined();
      expect(item?.date, id).toBeNull();
      expect(item?.ics, id).toBeNull();
      expect(item?.googleUrl, id).toBeNull();
    }
    expect(row(result, "tax-and-resident-tax")?.timing).toContain("窓口への確認が必要");
    expect(row(result, "tax-and-resident-tax")?.audience).toContain("一律の法定期限にしない");
    expect(row(result, "market-value")?.timing).toContain("推奨時期");
  });

  it("働き方が未定のとき、独立だけの行は必須にならない", () => {
    const result = evaluate(rules, input({ work: "undecided", openingDate: null }));
    for (const id of ["opening-notification", "blue-return-march-15", "blue-return-two-months"]) {
      const item = row(result, id);
      expect(item, id).toBeDefined();
      expect(item?.required, id).toBe(false);
      expect(item?.date, id).toBeNull();
      expect(item?.audience, id).toContain("候補。必須ではない。");
    }
  });

  it("転職で入社日が無くても、確認リストが出る", () => {
    const result = evaluate(rules, input({ work: "career-change", openingDate: null, joiningDate: null }));
    expect(result.length).toBeGreaterThan(0);
    expect(row(result, "opening-notification")).toBeUndefined();
    expect(row(result, "blue-return-two-months")).toBeUndefined();
    expect(result.every((item) => item.date === null)).toBe(true);
  });

  it("健康保険が未定のとき、任意継続・国保・扶養は必須にしない", () => {
    const result = evaluate(rules, input({ insurance: "undecided" }));
    for (const id of ["health-voluntary", "health-national", "health-dependent"]) {
      expect(row(result, id)?.required).toBe(false);
    }
    expect(row(result, "health-employer")).toBeUndefined();
  });

  it("選んだ健康保険だけを必須にする", () => {
    const result = evaluate(rules, input({ insurance: "voluntary" }));
    expect(row(result, "health-voluntary")?.required).toBe(true);
    expect(row(result, "health-national")).toBeUndefined();
    expect(row(result, "health-dependent")).toBeUndefined();
    expect(row(result, "health-employer")).toBeUndefined();
  });

  it("企業型DCは加入がはいの人だけ。資格喪失日が不明なら勤務先へ確認し、日付は出さない", () => {
    expect(row(evaluate(rules, input({ dc: "no" })), "corporate-dc")).toBeUndefined();
    expect(row(evaluate(rules, input({ dc: "unknown" })), "corporate-dc")).toBeUndefined();
    const unknown = row(evaluate(rules, input({ dc: "yes", lossDateKnown: false })), "corporate-dc");
    expect(unknown?.date).toBeNull();
    expect(unknown?.office).toBe("勤務先");
    expect(unknown?.audience).toContain("勤務先へ確認する");
    expect(unknown?.audience).toContain("退職日からは期限を作らない");
    const known = row(evaluate(rules, input({ dc: "yes", lossDateKnown: true })), "corporate-dc");
    expect(known?.date).toBeNull();
    expect(known?.audience).toContain("日付は出さない");
  });

  it("起業時の特例は、給付を受けながら事業を続ける仕組みとは別に書き、日数は書かない", () => {
    const item = row(evaluate(rules, input({ benefit: "consider" })), "employment-startup");
    expect(item?.audience).toContain("給付を受けながら事業を続ける仕組みとは別");
    expect(item?.audience).not.toMatch(/\d/);
    expect(item?.date).toBeNull();
    expect(row(evaluate(rules, input({ benefit: "decline" })), "employment-startup")).toBeUndefined();
  });

  it("カレンダー追加には手続き名と日付だけを載せる", () => {
    const opening = row(evaluate(rules, input()), "opening-notification");
    const url = new URL(opening?.googleUrl ?? "");
    expect(`${url.origin}${url.pathname}`).toBe("https://calendar.google.com/calendar/render");
    expect(url.searchParams.get("action")).toBe("TEMPLATE");
    expect(url.searchParams.get("text")).toBe("個人事業の開業・廃業等届出書");
    expect(url.searchParams.get("dates")).toBe("20270315/20270316");
    expect([...url.searchParams.keys()].sort()).toEqual(["action", "dates", "text"]);
    expect(opening?.googleUrl).not.toContain("20260331");
    expect(opening?.googleUrl).not.toContain("20260401");
    expect(opening?.googleUrl).not.toContain("national");
    const ics = unfoldIcs(opening?.ics ?? "");
    expect(ics).toContain("DTSTART;VALUE=DATE:20270315");
    expect(ics).toContain("SUMMARY:個人事業の開業・廃業等届出書");
    expect(ics).not.toContain("20260331");
    expect(ics).not.toContain("2026-04-01");
    expect(ics).not.toContain("national");
  });
});
