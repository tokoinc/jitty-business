import { describe, expect, it } from "vitest";
import { site, validateSite, type SiteCheck } from "../../src/site.config";

const demo: SiteCheck = {
  ...site,
  mode: "demo",
  url: "https://example.com",
  contact: { email: "", formUrl: "" },
};
const withContact = (contact: Partial<SiteCheck["contact"]>): SiteCheck => ({
  ...demo,
  contact: { ...demo.contact, ...contact },
});

describe("validateSite", () => {
  it("demo の既定値は通る", () => {
    expect(() => validateSite(demo)).not.toThrow();
  });

  it("メールアドレスに件名や宛先を足させない", () => {
    expect(() => validateSite(withContact({ email: "editor@media.example.jp" }))).not.toThrow();
    expect(() => validateSite(withContact({ email: "a@b.example?bcc=x@y.example" }))).toThrow(
      /contact.email/,
    );
    expect(() => validateSite(withContact({ email: "a@b.example\nBcc: x@y.example" }))).toThrow(
      /contact.email/,
    );
  });

  it("フォームの URL は https だけ", () => {
    expect(() => validateSite(withContact({ formUrl: "https://forms.example.jp/contact" }))).not.toThrow();
    expect(() => validateSite(withContact({ formUrl: "javascript:alert(1)" }))).toThrow(/formUrl/);
    expect(() => validateSite(withContact({ formUrl: "http://forms.example.jp/contact" }))).toThrow(
      /formUrl/,
    );
  });

  it("site.url は http(s) の URL", () => {
    expect(() => validateSite({ ...demo, url: "javascript:alert(1)" })).toThrow(/site.url/);
    expect(() => validateSite({ ...demo, url: "not a url" })).toThrow(/site.url/);
  });
});
