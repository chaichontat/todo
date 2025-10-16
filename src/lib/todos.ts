export type TodoStatus = 'normal' | 'pulled';

export const KEY = 'current';
export interface Todo {
	id: number;
	text: string;
	status: TodoStatus;
	pullout: number;
}

export const DEFAULT_TODOS: Todo[] = [
	{ id: 1, text: 'Review pull request #234', status: 'normal', pullout: 0 },
	{ id: 2, text: 'Update documentation for API v2', status: 'normal', pullout: 0 },
	{ id: 3, text: 'Fix bug in user authentication flow', status: 'pulled', pullout: 20 },
	{ id: 4, text: 'Meeting with design team at 2pm', status: 'normal', pullout: 0 },
	{ id: 5, text: 'Refactor database query optimizer', status: 'pulled', pullout: 35 }
];

export function cloneTodos(source: Todo[]): Todo[] {
	return source.map((item) => ({ ...item }));
}
