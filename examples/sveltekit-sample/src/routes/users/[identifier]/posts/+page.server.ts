import type { Action, Actions } from "./$types";
import { error, redirect } from "@sveltejs/kit";
import { postStore } from "$lib/store";
import { Create, Note } from "@fedify/fedify";
import federation from "$lib/federation";
import type { PageServerLoad } from "./$types";
import fedi from "$lib/federation";
import { getPosts, getUser } from "$lib/fetch";

const post: Action = async (event) => {
	const data = await event.request.formData();
	const content = data.get("content") as string;
	const identifier = data.get("identifier") as string;

	if (typeof content !== "string" || typeof identifier !== "string") {
		error(400, "Content and identifier are required");
	}
	const ctx = federation.createContext(event.request, undefined);
	const id = crypto.randomUUID();
	const attribution = ctx.getActorUri(identifier);
	const url = new URL(`/users/${identifier}/posts/${id}`, attribution);
	const post = new Note({
		id: url,
		attribution,
		content,
		url,
	});
	try {
		postStore.append([post!]);
		const note = await ctx.getObject(Note, { identifier, id });
		await ctx.sendActivity(
			{ identifier },
			"followers",
			new Create({
				id: new URL("#activity", attribution),
				object: note,
				actors: note?.attributionIds,
				tos: note?.toIds,
				ccs: note?.ccIds,
			}),
		);
		// await getPosts().refresh();
	} catch {
		postStore.delete(url);
	}
	redirect(303, `/users/${identifier}/posts`);
};

export const actions = { post } satisfies Actions;

export const load: PageServerLoad = async ({ request, params }) => {
	try {
		const ctx = fedi.createContext(request, undefined);
		const { identifier } = params;

		const user = await getUser(ctx, identifier);
		const posts = await getPosts(user);

		return { user, posts };
	} catch {
		error(404, { message: "Not Found" });
	}
};
