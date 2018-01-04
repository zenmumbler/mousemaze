/// <reference path="./maze.ts" />

interface GameState {
	ctx: CanvasRenderingContext2D;
	grid: Grid;
	positions: GridPos[];
	target: GridPos;
}

let state: GameState = {
	ctx: document.querySelector("canvas")!.getContext("2d")!,
	grid: new Grid(11, 11),
	positions: [],
	target: { x: 0, y: 0 }
};

