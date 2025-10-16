import { command, getRequestEvent, query } from '$app/server';
import type { Todo } from './todos';

type KVGetInput = { key: string };
type KVSetInput = { key: string; value: Todo[] };

export const getValue = query('unchecked', async ({ key }: KVGetInput) => {
	const { platform } = getRequestEvent();
	const kv = platform?.env?.DATA as KVNamespace | undefined;
	if (!kv) throw new Error('Missing KV binding DATA on event.platform.env');
	const res = await kv.get(key);
	if (!res) return [];
	return JSON.parse(res) as Todo[];
});

export const setValue = command('unchecked', async ({ key, value }: KVSetInput) => {
	const { platform } = getRequestEvent();
	const kv = platform?.env?.DATA as KVNamespace | undefined;
	if (!kv) throw new Error('Missing KV binding DATA on event.platform.env');
	await kv.put(key, JSON.stringify(value));
});
