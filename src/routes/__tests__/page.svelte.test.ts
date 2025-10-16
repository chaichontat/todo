import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanup, render, type RenderResult } from 'vitest-browser-svelte';

import { cloneTodos, DEFAULT_TODOS } from '$lib/todos';

import Page from '../+page.svelte';

type PageRenderResult = RenderResult<typeof Page>;

const readStripOrder = async (screen: PageRenderResult) => {
	const listLocator = screen.getByTestId('strip-list');
	const stripLocator = listLocator.locator('[data-testid="task-strip"]');
	return stripLocator.evaluateAll((nodes) =>
		nodes.map((node) => {
			const element = node as HTMLElement;
			const { taskId } = element.dataset;
			return taskId ? Number.parseInt(taskId, 10) : Number.NaN;
		})
	);
};

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
	window.localStorage.clear();
	let persisted = cloneTodos(DEFAULT_TODOS);

	fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
		if (init?.method === 'PUT' && typeof init.body === 'string') {
			const payload = JSON.parse(init.body) as { todos?: unknown };
			if (Array.isArray(payload.todos)) {
				persisted = payload.todos as typeof persisted;
			}
		}

		return new Response(JSON.stringify({ todos: persisted }), {
			headers: { 'Content-Type': 'application/json' }
		});
	});

	vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
});

describe('drag and drop ordering', () => {
	test('moving a strip downward inserts it at the hovered position', async () => {
		const screen = render(Page, {
			props: {
				data: { todos: cloneTodos(DEFAULT_TODOS) }
			}
		});

		const firstStrip = screen.getByText('Review pull request #234');
		const dropTarget = screen.getByText('Meeting with design team at 2pm');

		await firstStrip.dragTo(dropTarget);

		await expect.poll(async () => readStripOrder(screen)).toEqual([2, 3, 4, 1, 5]);
	});

	test('dragging a strip upward inserts it before the hovered item', async () => {
		const screen = render(Page, {
			props: {
				data: { todos: cloneTodos(DEFAULT_TODOS) }
			}
		});

		const draggedStrip = screen.getByText('Meeting with design team at 2pm');
		const targetStrip = screen.getByText('Update documentation for API v2');

		await draggedStrip.dragTo(targetStrip);

		await expect.poll(async () => readStripOrder(screen)).toEqual([1, 4, 2, 3, 5]);
	});

	test('dragging a strip to the end appends it at the bottom', async () => {
		const screen = render(Page, {
			props: {
				data: { todos: cloneTodos(DEFAULT_TODOS) }
			}
		});

		const firstStrip = screen.getByText('Review pull request #234');
		const lastStrip = screen.getByText('Refactor database query optimizer');

		await firstStrip.dragTo(lastStrip);

		await expect.poll(async () => readStripOrder(screen)).toEqual([2, 3, 4, 5, 1]);
	});
});
