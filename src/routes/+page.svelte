<script>
	import { GripVertical, Plus, X } from '@lucide/svelte';
	import { flip } from 'svelte/animate';
	import { quintOut } from 'svelte/easing';

	// Load from localStorage or use defaults
	const loadStrips = () => {
		if (typeof localStorage !== 'undefined') {
			const saved = localStorage.getItem('atc-strips');
			if (saved) {
				try {
					return JSON.parse(saved);
				} catch (e) {
					console.error('Failed to parse saved strips:', e);
				}
			}
		}
		return [
			{ id: 1, text: 'Review pull request #234', status: 'normal', pullout: 0 },
			{ id: 2, text: 'Update documentation for API v2', status: 'normal', pullout: 0 },
			{ id: 3, text: 'Fix bug in user authentication flow', status: 'pulled', pullout: 20 },
			{ id: 4, text: 'Meeting with design team at 2pm', status: 'normal', pullout: 0 },
			{ id: 5, text: 'Refactor database query optimizer', status: 'pulled', pullout: 35 }
		];
	};

	let strips = $state(loadStrips());
	let newTaskText = $state('');
	let draggingId = $state(null);
	let dropTarget = $state(null);

	function dropSlotClasses(targetId) {
		let heightClass = 'h-0';
		let marginClass = 'my-0';
		let emphasisClasses = '';

		if (draggingId !== null) {
			heightClass = 'h-2';
			marginClass = 'my-1';
		}

		if (dropTarget === targetId && draggingId !== null) {
			heightClass = 'h-11';
			marginClass = 'my-3';
			emphasisClasses = 'border-blue-500/60 bg-blue-500/10';
		}

		return `w-full rounded-xl border border-dashed border-transparent bg-transparent transition-all duration-150 ease-out ${heightClass} ${marginClass} ${emphasisClasses}`;
	}

	// Persist to localStorage whenever strips change
	$effect(() => {
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('atc-strips', JSON.stringify(strips));
		}
	});

	function handleDragStart(e, id) {
		draggingId = id;
		dropTarget = id;
		e.dataTransfer.effectAllowed = 'move';
		e.dataTransfer.setData('text/plain', String(id));
}

	function handleDragEnd() {
		resetDragState();
}

	function handleDragOver(e) {
		e.preventDefault();
		if (draggingId === null) return;
		e.dataTransfer.dropEffect = 'move';
}

	function handleDrop(e, targetId) {
		e.preventDefault();
		if (draggingId === null) {
			resetDragState();
			return;
		}

		const destination = targetId ?? dropTarget ?? 'end';
		reorderStrips(draggingId, destination);
		resetDragState();
	}

	function handleDragEnter(targetId) {
		if (draggingId === null) return;
		dropTarget = targetId;
	}

	function handleDragLeave(targetId) {
		if (dropTarget === targetId) {
			dropTarget = null;
		}
}

	function reorderStrips(sourceId, targetId) {
		const currentIndex = strips.findIndex((strip) => strip.id === sourceId);
		if (currentIndex === -1) return;

		const destinationIndex =
			targetId === 'end' ? strips.length : strips.findIndex((strip) => strip.id === targetId);
		if (destinationIndex === -1 && targetId !== 'end') return;

		const updated = [...strips];
		const [moved] = updated.splice(currentIndex, 1);

		if (targetId === 'end') {
			updated.push(moved);
		} else {
			const insertIndex = destinationIndex > currentIndex ? destinationIndex - 1 : destinationIndex;
			updated.splice(insertIndex, 0, moved);
		}

		strips = updated;
	}

	function resetDragState() {
		draggingId = null;
		dropTarget = null;
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
			<div class="space-y-2">
				{#snippet dropSlot(targetId)}
					<div
						class={dropSlotClasses(targetId)}
						ondragenter={() => handleDragEnter(targetId)}
						ondragover={handleDragOver}
						ondragleave={() => handleDragLeave(targetId)}
						ondrop={(event) => handleDrop(event, targetId)}
					></div>
				{/snippet}

				{#each strips as strip (strip.id)}
					{@render dropSlot(strip.id)}

					<div
						draggable="true"
						data-strip-id={strip.id}
						ondragstart={(e) => handleDragStart(e, strip.id)}
						ondragend={handleDragEnd}
						ondragenter={() => handleDragEnter(strip.id)}
						ondragover={handleDragOver}
						ondrop={(e) => handleDrop(e, strip.id)}
						class="relative select-none"
						style="
              transform: translateX({strip.pullout}px);
              opacity: {draggingId === strip.id ? 0.4 : 1};
              transition: transform 0.2s ease-out, opacity 0.15s ease-out;
            "
						animate:flip={{ duration: 300, easing: quintOut }}
					>
						<div
							class="flex items-center gap-3 rounded p-4 shadow-lg transition-colors
              {strip.status === 'pulled'
								? 'border-2 border-amber-500/50 bg-amber-500/20'
								: 'border-2 border-slate-600 bg-slate-700'}
              {dropTarget === strip.id && draggingId !== null
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

				{@render dropSlot('end')}
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
