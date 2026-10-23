import { parsePreferences, read, write, onExternalChange, type Preferences } from "./store";

const root = document.documentElement;
function apply(p: Preferences) {
  if (p.theme === "system") delete root.dataset.theme;
  else root.dataset.theme = p.theme;
  root.dataset.fontScale = p.fontScale;
  for (const el of document.querySelectorAll<HTMLInputElement>('#dd-settings input[name="theme"]'))
    el.checked = el.value === p.theme;
  for (const el of document.querySelectorAll<HTMLInputElement>('#dd-settings input[name="font"]'))
    el.checked = el.value === p.fontScale;
}
const current = () =>
  read("preferences", parsePreferences) ?? {
    version: 1 as const,
    theme: "system" as const,
    fontScale: "md" as const,
  };
apply(current());
document.getElementById("dd-settings")?.addEventListener("change", (e) => {
  const t = e.target as HTMLInputElement;
  const p = { ...current() };
  if (t.name === "theme") p.theme = t.value as Preferences["theme"];
  if (t.name === "font") p.fontScale = t.value as Preferences["fontScale"];
  write("preferences", p);
  apply(p);
});
onExternalChange("preferences", () => apply(current()));
