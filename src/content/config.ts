import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
	schema: z.object({
		title: z.string(),
		description: z.string(),
		pubDate: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		version: z.string(),
		category: z.enum(['News', 'Mods', 'Column', 'Tech']),
		tags: z.array(z.string()).default([]),
		heroImage: z.string().optional(),
	}),
});

export const collections = { blog };
