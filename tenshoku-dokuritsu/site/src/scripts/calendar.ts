import {
  evaluate,
  type CalendarInput,
  type CalendarResult,
  type CalendarRule,
} from "@/utils/calendar";

const form = document.querySelector<HTMLFormElement>("#calendar-form");
if (form) setup(form);

function setup(form: HTMLFormElement) {
  const status = document.querySelector<HTMLElement>("#calendar-status");
  const results = document.querySelector<HTMLElement>("#calendar-results");
  const body = document.querySelector<HTMLElement>("#calendar-rows");
  const rules = parseRules(form.dataset.rules ?? "");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    run(form, rules, status, results, body);
  });
  window.addEventListener("pageshow", (event) => {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (event.persisted || nav?.type === "reload") {
      form.reset();
      clear(status, results, body);
    }
  });
}

function run(
  form: HTMLFormElement,
  rules: CalendarRule[],
  status: HTMLElement | null,
  results: HTMLElement | null,
  body: HTMLElement | null,
) {
  const read = readInput(form);
  if (!read.ok) {
    clear(status, results, body);
    if (status) status.textContent = read.message;
    read.focus?.focus();
    return;
  }
  const rows = evaluate(rules, read.input);
  if (status) status.textContent = `${rows.length}件の確認項目です。`;
  render(rows, results, body);
}

function clear(status: HTMLElement | null, results: HTMLElement | null, body: HTMLElement | null) {
  if (status) status.textContent = "";
  if (body) body.replaceChildren();
  if (results) results.hidden = true;
}

function render(rows: CalendarResult[], results: HTMLElement | null, body: HTMLElement | null) {
  if (!results || !body) return;
  body.replaceChildren();
  for (const row of rows) {
    body.append(renderRow(row));
  }
  results.hidden = false;
}

function renderRow(row: CalendarResult): HTMLTableRowElement {
  const tr = document.createElement("tr");
  tr.dataset.rule = row.id;
  if (row.date) tr.dataset.date = row.date;
  tr.append(
    cell(row.title),
    cell(row.audience),
    cell(row.timing),
    cell(row.office),
    articlesCell(row),
    calendarCell(row),
  );
  return tr;
}

function cell(text: string): HTMLTableCellElement {
  const td = document.createElement("td");
  td.textContent = text;
  return td;
}

function articlesCell(row: CalendarResult): HTMLTableCellElement {
  const td = document.createElement("td");
  const list = document.createElement("ul");
  for (const article of row.articles) {
    const li = document.createElement("li");
    if (article.href) {
      const link = document.createElement("a");
      link.href = article.href;
      link.textContent = article.title;
      li.append(link);
    } else {
      li.textContent = article.title;
    }
    list.append(li);
  }
  td.append(list);
  return td;
}

function calendarCell(row: CalendarResult): HTMLTableCellElement {
  const td = document.createElement("td");
  if (!row.date || !row.ics || !row.googleUrl) {
    td.textContent = "追加しない";
    return td;
  }
  const download = document.createElement("button");
  download.type = "button";
  download.textContent = ".ics を端末へダウンロード";
  download.addEventListener("click", () => downloadIcs(row.id, row.ics ?? ""));
  const google = document.createElement("a");
  google.href = row.googleUrl;
  google.target = "_blank";
  google.rel = "noopener noreferrer";
  google.textContent = "Googleカレンダーに追加";
  td.append(download, document.createTextNode(" "), google);
  return td;
}

function downloadIcs(id: string, body: string) {
  const blob = new Blob([body], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${id}.ics`;
  link.click();
  URL.revokeObjectURL(url);
}

function parseRules(raw: string): CalendarRule[] {
  if (!raw) return [];
  const parsed: unknown = JSON.parse(raw);
  return Array.isArray(parsed) ? (parsed as CalendarRule[]) : [];
}

type Read = { ok: true; input: CalendarInput } | { ok: false; message: string; focus: HTMLElement | null };

function readInput(form: HTMLFormElement): Read {
  const retirement = valueOf(form, "retirement");
  if (!retirement) return missing("退職予定日を入れてください。", form.elements.namedItem("retirement"));
  const work = oneOf(checked(form, "work"), ["independence", "career-change", "undecided"] as const);
  if (!work) return missing("次の働き方を選んでください。", form.querySelector('input[name="work"]'));
  const opening = valueOf(form, "opening");
  if (work === "independence" && !opening) {
    return missing("独立を選んだときは、開業日を入れてください。", form.elements.namedItem("opening"));
  }
  const joiningUndecided = form.querySelector<HTMLInputElement>('input[name="joining-undecided"]')?.checked ?? false;
  const joining = valueOf(form, "joining");
  if (work === "career-change" && !joiningUndecided && !joining) {
    return missing("入社日を入れるか、「入社日未定」を選んでください。", form.elements.namedItem("joining"));
  }
  const insurance = oneOf(checked(form, "insurance"), [
    "voluntary",
    "national",
    "dependent",
    "employer",
    "undecided",
  ] as const);
  if (!insurance) return missing("退職後の健康保険を選んでください。", form.querySelector('input[name="insurance"]'));
  const benefit = oneOf(checked(form, "benefit"), ["consider", "decline", "undecided"] as const);
  if (!benefit) return missing("失業給付の利用意向を選んでください。", form.querySelector('input[name="benefit"]'));
  const dc = oneOf(checked(form, "dc"), ["yes", "no", "unknown"] as const);
  if (!dc) return missing("企業型DCに加入していたかを選んでください。", form.querySelector('input[name="dc"]'));
  const loss = oneOf(checked(form, "loss"), ["known", "unknown"] as const);
  if (!loss) return missing("資格喪失日が分かるか選んでください。", form.querySelector('input[name="loss"]'));
  const spouse = oneOf(checked(form, "spouse"), ["yes", "no", "unknown"] as const);
  if (!spouse) return missing("配偶者の年金の確認が必要か選んでください。", form.querySelector('input[name="spouse"]'));
  return {
    ok: true,
    input: {
      retirementDate: retirement,
      work,
      openingDate: opening || null,
      joiningDate: joiningUndecided ? null : joining || null,
      insurance,
      benefit,
      dc,
      lossDateKnown: loss === "known",
      spouse,
    },
  };
}

function missing(message: string, focus: Element | RadioNodeList | null): Read {
  const element = focus instanceof HTMLElement ? focus : null;
  return { ok: false, message, focus: element };
}

function valueOf(form: HTMLFormElement, name: string): string {
  const field = form.elements.namedItem(name);
  return field instanceof HTMLInputElement ? field.value.trim() : "";
}

function checked(form: HTMLFormElement, name: string): string | null {
  const field = form.querySelector<HTMLInputElement>(`input[name="${name}"]:checked`);
  return field?.value ?? null;
}

function oneOf<T extends string>(value: string | null, allowed: readonly T[]): T | null {
  return allowed.includes(value as T) ? (value as T) : null;
}
