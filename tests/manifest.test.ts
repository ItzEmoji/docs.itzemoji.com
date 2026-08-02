import { describe, expect, test } from "bun:test";
import { parseManifest, selectProjects, type ProjectConfig } from "../src/manifest.ts";

const valid = {
  projects: [
    {
      name: "aeroflare",
      path: "projects/aeroflare",
      buildCommand: "bun run docs:build",
      outputDir: "docs/.vitepress/dist",
      title: "Aeroflare",
      description: "Flight planning toolkit.",
    },
  ],
};

function withProjects(projects: unknown[]): string {
  return JSON.stringify({ projects });
}

describe("parseManifest", () => {
  test("parses a valid manifest", () => {
    const projects = parseManifest(JSON.stringify(valid));
    expect(projects).toHaveLength(1);
    expect(projects[0]!.name).toBe("aeroflare");
    expect(projects[0]!.outputDir).toBe("docs/.vitepress/dist");
  });

  test("accepts an empty project list", () => {
    expect(parseManifest(withProjects([]))).toEqual([]);
  });

  test("rejects invalid JSON", () => {
    expect(() => parseManifest("{ not json")).toThrow(/not valid JSON/);
  });

  test("rejects a missing projects array", () => {
    expect(() => parseManifest("{}")).toThrow(/"projects" array/);
  });

  test("names the missing field and the offending project", () => {
    const broken = { ...valid.projects[0], title: undefined };
    expect(() => parseManifest(withProjects([broken]))).toThrow(
      /project "aeroflare".*"title"/,
    );
  });

  test("reports the index when the name itself is missing", () => {
    const broken = { ...valid.projects[0], name: undefined };
    expect(() => parseManifest(withProjects([broken]))).toThrow(/index 0.*"name"/);
  });

  test("rejects a malformed name", () => {
    const broken = { ...valid.projects[0], name: "Aero Flare" };
    expect(() => parseManifest(withProjects([broken]))).toThrow(/lowercase/);
  });

  test("rejects duplicate names", () => {
    expect(() =>
      parseManifest(withProjects([valid.projects[0], valid.projects[0]])),
    ).toThrow(/duplicate project name "aeroflare"/);
  });

  test("rejects a non-string field", () => {
    const broken = { ...valid.projects[0], description: 42 };
    expect(() => parseManifest(withProjects([broken]))).toThrow(/"description"/);
  });
});

describe("selectProjects", () => {
  const projects: ProjectConfig[] = [
    { ...valid.projects[0]! },
    { ...valid.projects[0]!, name: "beacon", title: "Beacon" },
  ];

  test("returns every project when no names are given", () => {
    expect(selectProjects(projects, []).map((p) => p.name)).toEqual([
      "aeroflare",
      "beacon",
    ]);
  });

  test("returns only the requested projects in manifest order", () => {
    expect(selectProjects(projects, ["beacon", "aeroflare"]).map((p) => p.name)).toEqual(
      ["aeroflare", "beacon"],
    );
  });

  test("throws listing the valid names for an unknown project", () => {
    expect(() => selectProjects(projects, ["nope"])).toThrow(
      /unknown project "nope".*aeroflare, beacon/,
    );
  });
});
