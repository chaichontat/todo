import { KEY, type Todo } from '$lib/todos';

export const load = async ({ platform }) => {
	const kv = platform?.env?.DATA as KVNamespace | undefined;
	if (!kv) throw new Error('Missing KV binding DATA on event.platform.env');
	const res = await kv.get(KEY);
	if (!res) return { todos: [] };
	return { todos: JSON.parse(res) as Todo[] };
};
