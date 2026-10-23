const root = document.documentElement;
const real = root.dataset.finish === "real";
const allowed = real ? ["", "L1", "L2"] : ["", "L1", "L2", "L3"]; // L3 は質感によらず同じため flat の build だけで見る
function set(mode: string) {
  if (!allowed.includes(mode)) mode = "";
  if (mode) root.dataset.inspect = mode;
  else delete root.dataset.inspect;
  document.querySelectorAll<HTMLButtonElement>(".dd-inspect button").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.value === mode));
  });
}
set(new URLSearchParams(location.search).get("inspect") ?? "");
document.querySelectorAll<HTMLButtonElement>(".dd-inspect button").forEach((b) => {
  b.hidden = !allowed.includes(b.value);
  b.addEventListener("click", () => set(b.value));
});
