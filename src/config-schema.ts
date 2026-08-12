import { z } from "zod";
import { resolveSafePath } from "./paths.js";

const hexColor = z
  .string()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/, "Invalid hex color");

const interactionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("click"),
    selector: z.string().min(1),
  }),
  z.object({
    type: z.literal("type"),
    selector: z.string().min(1),
    text: z.string(),
  }),
  z.object({
    type: z.literal("press"),
    key: z.string().min(1),
  }),
]);

const focusSchema = z.object({
  selector: z.string().min(1),
  padding: z.number().nonnegative().optional(),
});

const sectionSchema = z
  .object({
    id: z
      .string()
      .min(1)
      .regex(/^[a-zA-Z0-9_-]+$/, "Section id must be alphanumeric, _, or -"),
    kind: z.enum(["title", "route"]).optional(),
    route: z.string().optional(),
    text: z.string().min(1),
    waitForText: z.array(z.string().min(1)).optional(),
    waitForSelector: z.array(z.string().min(1)).optional(),
    failOnSelector: z.array(z.string().min(1)).optional(),
    interaction: interactionSchema.optional(),
    focus: focusSchema.optional(),
    capture: z.enum(["still", "video"]).optional(),
  })
  .superRefine((section, ctx) => {
    const kind = section.kind ?? "route";
    if (kind === "route" && !section.route) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Section "${section.id}" of kind route requires route`,
        path: ["route"],
      });
    }
    if (kind === "title" && section.route) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Section "${section.id}" of kind title should not set route`,
        path: ["route"],
      });
    }
  });

export const demoConfigSchema = z.object({
  baseUrl: z.string().url(),
  output: z.object({
    video: z.string().min(1),
    captions: z.string().min(1),
    draftDir: z.string().min(1),
  }),
  video: z
    .object({
      width: z.number().int().positive().default(1920),
      height: z.number().int().positive().default(1080),
      fps: z.number().int().positive().default(30),
      fit: z.enum(["pad"]).default("pad"),
      background: hexColor.default("#1E1033"),
    })
    .default({}),
  branding: z
    .object({
      title: z.string().default("Product Demo"),
      subtitle: z.string().optional(),
      logoPath: z.string().optional(),
    })
    .optional(),
  auth: z
    .object({
      storageState: z.string().min(1),
    })
    .optional(),
  tts: z
    .object({
      provider: z.enum(["edge-tts"]).default("edge-tts"),
      voice: z.string().default("en-US-AvaNeural"),
      rate: z.string().default("+0%"),
    })
    .default({}),
  sections: z.array(sectionSchema).min(1),
});

export type DemoConfig = z.infer<typeof demoConfigSchema>;
export type DemoSection = DemoConfig["sections"][number];
export type DemoInteraction = NonNullable<DemoSection["interaction"]>;

export interface ResolvedDemoConfig extends DemoConfig {
  projectRoot: string;
  resolved: {
    video: string;
    captions: string;
    draftDir: string;
    storageState?: string;
    logoPath?: string;
  };
}

export function parseDemoConfig(
  raw: unknown,
  projectRoot: string,
  options: { allowEscape?: boolean } = {},
): ResolvedDemoConfig {
  const config = demoConfigSchema.parse(raw);
  const allow = { allowEscape: options.allowEscape };
  const resolved = {
    video: resolveSafePath(projectRoot, config.output.video, allow),
    captions: resolveSafePath(projectRoot, config.output.captions, allow),
    draftDir: resolveSafePath(projectRoot, config.output.draftDir, allow),
    storageState: config.auth?.storageState
      ? resolveSafePath(projectRoot, config.auth.storageState, allow)
      : undefined,
    logoPath: config.branding?.logoPath
      ? resolveSafePath(projectRoot, config.branding.logoPath, allow)
      : undefined,
  };
  return { ...config, projectRoot, resolved };
}

export function sectionCaptureMode(section: DemoSection): "still" | "video" {
  if (section.capture) return section.capture;
  return section.interaction ? "video" : "still";
}

export function sectionKind(section: DemoSection): "title" | "route" {
  return section.kind ?? "route";
}
