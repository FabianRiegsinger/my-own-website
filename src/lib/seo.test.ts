import { describe, expect, it } from "vitest";
import { cvDe } from "@/content/cv.de";
import { cvEn } from "@/content/cv.en";
import { profilePageStructuredData, ROBOTS, siteStructuredData, verification } from "./seo";

describe("verification", () => {
  it("returns the Search Console tag when the env var is set", () => {
    expect(verification({ GOOGLE_SITE_VERIFICATION: "abc123" })).toEqual({ google: "abc123" });
  });

  it("trims it, and leaves it out when unset or blank", () => {
    expect(verification({ GOOGLE_SITE_VERIFICATION: "  abc123\n" })).toEqual({ google: "abc123" });
    expect(verification({})).toBeUndefined();
    expect(verification({ GOOGLE_SITE_VERIFICATION: "   " })).toBeUndefined();
  });
});

describe("ROBOTS", () => {
  it("allows indexing and full snippets and image previews for Google", () => {
    expect(ROBOTS).toMatchObject({ index: true, follow: true, googleBot: { "max-image-preview": "large", "max-snippet": -1 } });
  });
});

describe("siteStructuredData", () => {
  const url = "https://example.dev";
  const [website, person] = siteStructuredData(cvEn, url)["@graph"];
  const [, personDe] = siteStructuredData(cvDe, url)["@graph"];

  it("describes the website and the person behind it, linked by @id", () => {
    expect(person["@id"]).toBe("https://example.dev/#person");
    expect(website["@id"]).toBe("https://example.dev/#website");
    expect(website.publisher).toEqual({ "@id": person["@id"] });
  });

  it("gives the job title in the page's language under the same @id", () => {
    expect(person.jobTitle).toBe(cvEn.profile.headline);
    expect(personDe.jobTitle).toBe(cvDe.profile.headline);
    expect(personDe["@id"]).toBe(person["@id"]);
  });

  it("lists the profiles and never an email address or phone number", () => {
    const raw = JSON.stringify(siteStructuredData(cvEn, url)) + JSON.stringify(profilePageStructuredData(cvEn, "en", url));
    expect(person.sameAs).toHaveLength(3);
    expect(raw).not.toContain("@web.de");
    expect(raw).not.toMatch(/\+49|telephone|email/i);
  });
});

describe("profilePageStructuredData", () => {
  const url = "https://example.dev";

  it("is a ProfilePage at the language's own address, in that language", () => {
    const en = profilePageStructuredData(cvEn, "en", url);
    const de = profilePageStructuredData(cvDe, "de", url);
    expect([en["@type"], en.url, en.inLanguage]).toEqual(["ProfilePage", url, "en"]);
    expect([de.url, de.inLanguage, de.mainEntity.jobTitle]).toEqual([`${url}/de`, "de", cvDe.profile.headline]);
  });

  it("spells out the person in full, with the @id the site-wide data uses", () => {
    const page = profilePageStructuredData(cvEn, "en", url);
    expect(page.mainEntity).toMatchObject({ "@type": "Person", "@id": `${url}/#person`, name: cvEn.profile.name });
    expect(page.mainEntity.sameAs).toHaveLength(3);
    expect(page.isPartOf).toEqual({ "@id": `${url}/#website` });
  });
});
