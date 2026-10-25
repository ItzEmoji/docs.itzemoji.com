export interface ProjectConfig {
  name: string;
  title: string;
  description: string;
}

const REQUIRED_FIELDS = [
  "name",
  "title",
  "description",
] as const satisfies readonly (keyof ProjectConfig)[];

const NAME_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

/**
 * Paths the site's own assets occupy at the root of docs.itzemoji.com. A
 * project routed to one of them would shadow the assets, and every page that
 * loads its fonts from there would silently lose them.
 */
const RESERVED_NAMES = new Set(["fonts"]);

export function parseManifest(raw: string): ProjectConfig[] {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch (cause) {
    throw new Error(`projects.json is not valid JSON: ${(cause as Error).message}`);
  }

  const projects = (data as { projects?: unknown } | null)?.projects;
  if (!Array.isArray(projects)) {
    throw new Error('projects.json must contain a "projects" array');
  }

  const seen = new Set<string>();
  return projects.map((entry, index) => {
    const project = validateProject(entry, index);
    if (seen.has(project.name)) {
      throw new Error(`projects.json: duplicate project name "${project.name}"`);
    }
    seen.add(project.name);
    return project;
  });
}

function validateProject(entry: unknown, index: number): ProjectConfig {
  if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
    throw new Error(`projects.json: project at index ${index} must be an object`);
  }

  const record = entry as Record<string, unknown>;
  const rawName = record.name;
  // Identify the project by name where possible, by index otherwise.
  const label = typeof rawName === "string" && rawName.length > 0
    ? `project "${rawName}"`
    : `project at index ${index}`;

  for (const field of REQUIRED_FIELDS) {
    const value = record[field];
    if (typeof value !== "string" || value.length === 0) {
      throw new Error(
        `projects.json: ${label} requires a non-empty string "${field}"`,
      );
    }
  }

  const project = record as unknown as ProjectConfig;
  if (!NAME_PATTERN.test(project.name)) {
    throw new Error(
      `projects.json: ${label} has an invalid name — use lowercase letters, digits and dashes, starting with a letter or digit`,
    );
  }

  if (RESERVED_NAMES.has(project.name)) {
    throw new Error(
      `projects.json: ${label} uses the reserved name "${project.name}" — the site serves its own assets from that path, so pick another name`,
    );
  }

  return {
    name: project.name,
    title: project.title,
    description: project.description,
  };
}

export async function loadManifest(filePath: string): Promise<ProjectConfig[]> {
  const file = Bun.file(filePath);
  if (!(await file.exists())) {
    throw new Error(`manifest not found at ${filePath}`);
  }
  return parseManifest(await file.text());
}
