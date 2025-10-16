<script lang="ts">
	import { setValue } from '$lib/kv.remote';
	import { KEY, type Todo } from '$lib/todos';
	import GripVertical from '@lucide/svelte/icons/grip-vertical';
	import Plus from '@lucide/svelte/icons/plus';
	import X from '@lucide/svelte/icons/x';
	import isEqual from 'lodash-es/isEqual';
	import { flip } from 'svelte/animate';
	import { quintOut } from 'svelte/easing';

	const { data } = $props();
	const save = async (toSave: Todo[]) => {
		await setValue({ key: KEY, value: toSave });
	};

	let strips = $state(data.todos!);

	let newTaskText = $state('');

	// Index of the dragged item (source index in the *original* array)
	let draggedIndex = $state(null);

	// Insertion *slot* in [0, strips.length]. Example:
	//   0 -> before first item, 1 -> between 0 and 1, ..., strips.length -> append at end
	let dragOverIndex = $state(null);

	// Reference to the list container
	let listEl: HTMLElement;

	let oldStrips = [] as Todo[];
	$effect(() => {
		if (isEqual(oldStrips, strips)) return;

		save(strips);
		oldStrips = strips;
	});

	function handleDragStart(e, index) {
		draggedIndex = index;
	}

	function handleDragEnd() {
		draggedIndex = null;
		dragOverIndex = null;
	}

	// Called when dragging over a specific item; compute insertion slot using midpoint
	function handleDragOverItem(e, index) {
		e.preventDefault();
		if (draggedIndex === null) return;

		const rect = e.currentTarget.getBoundingClientRect();
		const offsetY = e.clientY - rect.top;
		const before = offsetY < rect.height / 2;

		// insertion index: before ? index : index + 1
		dragOverIndex = Math.max(0, Math.min(strips.length, before ? index : index + 1));
	}

	// Called when dragging over the list container (e.g., gaps or end of list)
	function handleDragOverContainer(e) {
		e.preventDefault();
		if (draggedIndex === null) return;

		const r = listEl.getBoundingClientRect();
		// If pointer is above or below, clamp to edges
		if (e.clientY < r.top) {
			dragOverIndex = 0;
			return;
		}
		if (e.clientY > r.bottom) {
			dragOverIndex = strips.length;
			return;
		}

		// Compute slot based on midpoints of children to cover gaps/end reliably
		const children = Array.from(listEl.children);
		if (children.length === 0) {
			dragOverIndex = 0;
			return;
		}

		let slot = 0;
		for (let i = 0; i < children.length; i += 1) {
			const rect = (children[i] as HTMLElement).getBoundingClientRect();
			const mid = rect.top + rect.height / 2;
			if (e.clientY < mid) {
				slot = i;
				break;
			}
			slot = i + 1; // default to after this item
		}

		dragOverIndex = Math.max(0, Math.min(children.length, slot));
	}

	function handleDrop(e) {
		e.preventDefault();

		if (draggedIndex === null || dragOverIndex === null) {
			return handleDragEnd();
		}

		// No-op if dropping into the same place
		if (dragOverIndex === draggedIndex || dragOverIndex === draggedIndex + 1) {
			return handleDragEnd();
		}

		const next = [...strips];
		const [moved] = next.splice(draggedIndex, 1);

		// If we remove an earlier index and insert after it, the insertion slot shifts by -1
		let to = dragOverIndex;
		if (draggedIndex < dragOverIndex) to -= 1;

		next.splice(to, 0, moved);
		strips = next;

		handleDragEnd();
	}

	function togglePullout(id) {
		strips = strips.map((strip) => {
			if (strip.id === id) {
				return {
					...strip,
					status: strip.status === 'pulled' ? 'normal' : 'pulled',
					pullout: strip.status === 'pulled' ? 0 : 25
				};
			}
			return strip;
		});
	}

	function addTask() {
		if (!newTaskText.trim()) return;

		const newId = strips.length > 0 ? Math.max(...strips.map((s) => s.id)) + 1 : 1;
		strips = [
			...strips,
			{
				id: newId,
				text: newTaskText,
				status: 'normal',
				pullout: 0
			}
		];
		newTaskText = '';
	}

	function deleteTask(id) {
		strips = strips.filter((strip) => strip.id !== id);
	}

	function handleKeyDown(e) {
		if (e.key === 'Enter') {
			addTask();
		}
	}
</script>

<div class="min-h-screen bg-slate-900 p-8">
	<div class="mx-auto max-w-4xl">
		<h1 class="mb-6 text-2xl font-bold text-slate-100">Task Control Strips</h1>

		<!-- Add new task input -->
		<div class="mb-6">
			<div class="flex gap-2">
				<input
					type="text"
					bind:value={newTaskText}
					onkeydown={handleKeyDown}
					placeholder="Add new task..."
					class="flex-1 rounded border border-slate-700 bg-slate-800 px-4 py-2 text-slate-100 placeholder-slate-500 focus:border-slate-500 focus:outline-none"
				/>
				<button
					onclick={addTask}
					class="flex items-center gap-2 rounded bg-slate-700 px-4 py-2 text-slate-100 transition-colors hover:bg-slate-600"
				>
					<Plus size={20} />
					Add
				</button>
			</div>
		</div>

		<!-- Bay holder -->
		<div class="rounded-lg border border-slate-700 bg-slate-800 p-4 shadow-2xl">
			<!-- List container is also a drop target so dropping at the end works -->
			<div
				class="space-y-2"
				bind:this={listEl}
				data-testid="strip-list"
				ondragover={handleDragOverContainer}
				ondrop={handleDrop}
			>
				{#each strips as strip, index (strip.id)}
					<div
						draggable="true"
						ondragstart={(e) => handleDragStart(e, index)}
						ondragend={handleDragEnd}
						ondragover={(e) => handleDragOverItem(e, index)}
						class="relative select-none"
						data-testid="task-strip"
						data-task-id={strip.id}
						style:transform="translateX({strip.pullout}px)"
						style:opacity={draggedIndex === index ? 0.4 : 1}
						style:margin-top={dragOverIndex === index ? '4rem' : '0'}
						style:margin-bottom={dragOverIndex === index + 1 ? '4rem' : '0'}
						style:transition="transform 0.2s ease-out, opacity 0.15s ease-out, margin 0.2s ease-out"
						animate:flip={{ duration: 300, easing: quintOut }}
					>
						<div
							class="flex items-center gap-3 rounded p-4 shadow-lg transition-colors
              {strip.status === 'pulled'
								? 'border-2 border-amber-500/50 bg-amber-500/20'
								: 'border-2 border-slate-600 bg-slate-700'}
              {(dragOverIndex === index || dragOverIndex === index + 1) && draggedIndex !== index
								? 'border-blue-500'
								: 'hover:border-slate-500'}"
						>
							<div class="flex flex-1 items-center gap-3">
								<span class="w-8 font-mono text-sm text-slate-400">
									{String(strip.id).padStart(2, '0')}
								</span>
								<span class="flex-1 font-medium text-slate-100">
									{strip.text}
								</span>
							</div>

							<div class="flex items-center gap-2">
								<button
									onclick={() => togglePullout(strip.id)}
									class="rounded bg-slate-600 px-2 py-1 text-xs text-slate-200 transition-colors hover:bg-slate-500"
								>
									{strip.status === 'pulled' ? 'Push In' : 'Pull Out'}
								</button>

								<button
									onclick={() => deleteTask(strip.id)}
									class="p-1 text-slate-400 transition-colors hover:text-red-400"
								>
									<X size={18} />
								</button>

								<div
									class="cursor-grab p-1 text-slate-400 hover:text-slate-300 active:cursor-grabbing"
								>
									<GripVertical size={20} />
								</div>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Legend -->
		<div class="mt-6 flex gap-6 text-sm text-slate-400">
			<div class="flex items-center gap-2">
				<div class="h-4 w-4 rounded border-2 border-slate-600 bg-slate-700"></div>
				<span>Standard position</span>
			</div>
			<div class="flex items-center gap-2">
				<div class="h-4 w-4 rounded border-2 border-amber-500/50 bg-amber-500/20"></div>
				<span>Pulled out (active focus)</span>
			</div>
			<div class="flex items-center gap-2">
				<GripVertical size={16} />
				<span>Drag to reorder</span>
			</div>
		</div>
	</div>
</div>
