/// <reference path="./maze.ts" />

const enum PlayerState {
	Idle,
	Moving,
	Winner
}

const enum Key {
	UP = 38,
	DOWN = 40,
	LEFT = 37,
	RIGHT = 39,
}

const SECS_PER_TILE = .5;

interface GameState {
	ctx: CanvasRenderingContext2D;
	mouse: HTMLElement;
	cheese: HTMLElement;
	mouseBaseTransform: string;

	grid: Grid;
	view: GridView;
	target: GridPos;

	positions: GridPos[];
	playerDir: Dir;
	playerState: PlayerState;
	playerTarget: GridPos;
	playerT0: number;
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

function checkWin() {
	if (equalPos(state.positions[0], state.target)) {
		state.playerState = PlayerState.Winner;
		(document.querySelector("#winner")! as HTMLElement).style.display = "block";
	}
}

function move(dir: Dir) {
	if (state.playerState !== PlayerState.Idle) {
		return;
	}

	const rot = { [Dir.N]: 180, [Dir.E]: -90, [Dir.S]: 0, [Dir.W]: 90 }[dir];
	state.mouse.style.transform = state.mouseBaseTransform + `rotate(${rot}deg)`;

	state.playerDir = dir;
	state.playerTarget = state.grid.nextStop(state.positions[0], dir);

	if (equalPos(state.playerTarget, state.positions[0])) {
		return;
	}
	state.playerState = PlayerState.Moving;
	state.playerT0 = Date.now() / 1000;

	const placeMouse = (p: GridPos) => {
		state.mouse.style.left = `${p.x}px`;
		state.mouse.style.top = `${p.y}px`;	
	};
	const interpolatePos = (a: GridPos, b: GridPos, t: number) => {
		return {
			x: a.x + (b.x - a.x) * t,
			y: a.y + (b.y - a.y) * t
		};
	};

	const step = () => {
		let curPos = state.positions[0];
		let nextPos = addPos(curPos, { x: dirDX.get(dir)!, y: dirDY.get(dir)! });
		
		let dt = (Date.now() / 1000) - state.playerT0;
		if (dt >= SECS_PER_TILE) {
			state.positions.unshift(nextPos);
			curPos = nextPos;
			nextPos = addPos(curPos, { x: dirDX.get(dir)!, y: dirDY.get(dir)! });

			if (equalPos(curPos, state.playerTarget)) {
				state.playerState = PlayerState.Idle;
				placeMouse(state.view.cellCentre(curPos));
				checkWin();
				return;
			}
			else {
				dt -= SECS_PER_TILE;
				state.playerT0 += SECS_PER_TILE;
			}
		}

		placeMouse(interpolatePos(state.view.cellCentre(curPos), state.view.cellCentre(nextPos), dt / SECS_PER_TILE));
		requestAnimationFrame(step);
	};
	step();
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
		mouseBaseTransform: "",

		grid,
		view,
		target,

		positions: [start],
		playerDir: Dir.S,
		playerState: PlayerState.Idle,
		playerTarget: start,
		playerT0: 0
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

	document.body.addEventListener("keydown", evt => {
		if (! evt.metaKey) {
			evt.preventDefault();
		}
		if (evt.repeat) {
			return;
		}
		if (evt.keyCode === Key.UP) { move(Dir.N); }
		else if (evt.keyCode === Key.RIGHT) { move(Dir.E); }
		else if (evt.keyCode === Key.DOWN) { move(Dir.S); }
		else if (evt.keyCode === Key.LEFT) { move(Dir.W); }
	});

	document.querySelector("#up")!.addEventListener("click", () => move(Dir.N));
	document.querySelector("#right")!.addEventListener("click", () => move(Dir.E));
	document.querySelector("#down")!.addEventListener("click", () => move(Dir.S));
	document.querySelector("#left")!.addEventListener("click", () => move(Dir.W));

}

window.onload = () => {
	main();
};
