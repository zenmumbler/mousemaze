/// <reference path="./maze.ts" />

interface GameState {
	ctx: CanvasRenderingContext2D;
	mouse: HTMLElement;
	cheese: HTMLElement;

	grid: Grid;
	view: GridView;
	target: GridPos;

	positions: GridPos[];
	playerDir: Dir;
}

let state: GameState;

function loadImage(src: string) {
	return new Promise<HTMLImageElement>((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = () => reject("fail");
		img.src = src;
	});
}

function main() {
	// grid size is determined by the search text, defaulting to M
	let GRID_SIZE: number;
	const sizeArg = location.search.substr(1).toLowerCase() || "m";
	switch (sizeArg) {
		case "s": GRID_SIZE = 5; break;
		case "m": GRID_SIZE = 7; break;
		case "l": GRID_SIZE = 9; break;
		case "xl": GRID_SIZE = 11; break;
		default: GRID_SIZE = 7; break;
	}

	// alloc and generate maze
	const grid = new Grid(GRID_SIZE, GRID_SIZE);
	grid.build(threshold(recursiveBacktrack, random, 0.85));

	// find a startingpoint closest to the bottom-left
	const starts = grid.deadends.map(p => ({
		...p,
		dist: grid.minDistance({ x: 0, y: grid.height - 1 }, p)
	}));
	starts.sort((a, b) => a.dist - b.dist);
	const start = starts.shift()!;

	// find the endpoint furthest away from the chosen startingpoint
	const exits = grid.deadends.map(p => ({
		...p,
		dist: grid.minDistance(start, p)
	}));
	exits.sort((a, b) => a.dist - b.dist);
	const target = exits.pop()!;

	// init view
	const ctx = document.querySelector("canvas")!.getContext("2d")!;
	const view = new GridView(grid, ctx);

	// create global game state
	state = {
		ctx,
		mouse: document.querySelector("#mouse")! as HTMLElement,
		cheese: document.querySelector("#cheese")! as HTMLElement,

		grid,
		view,
		target,

		positions: [start],
		playerDir: Dir.S
	};

	// render maze
	loadImage("img/wood.png").then(img => {
		render(view, img);
	});

	const mousePos = view.cellCentre(start);
	state.mouse.className = `obj obj${GRID_SIZE}`;
	state.mouse.style.left = `${mousePos.x}px`;
	state.mouse.style.top = `${mousePos.y}px`;

	const exitPos = view.cellCentre(target);
	state.cheese.className = `obj obj${GRID_SIZE}`;
	state.cheese.style.left = `${exitPos.x}px`;
	state.cheese.style.top = `${exitPos.y}px`;

	state.mouseBaseTransform = (getComputedStyle(state.mouse).transform || "") + " ";
	state.mouse.classList.add("animated");
}

main();
