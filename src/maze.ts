const enum Dir {
	N = 1,
	E = 2,
	S = 4,
	W = 8
}

const reverseDir = new Map([
	[Dir.N, Dir.S],
	[Dir.E, Dir.W],
	[Dir.S, Dir.N],
	[Dir.W, Dir.E]
]);

const dirDX = new Map([
	[Dir.N, 0],
	[Dir.E, 1],
	[Dir.S, 0],
	[Dir.W, -1]
]);

const dirDY = new Map([
	[Dir.N, -1],
	[Dir.E, 0],
	[Dir.S, 1],
	[Dir.W, 0]
]);

type Cell = number;

interface GridPos {
	x: number;
	y: number;
}

function scalePos(p: GridPos, s: number): GridPos {
	return {
		x: p.x * s,
		y: p.y * s
	};
}

function addPos(a: GridPos, b: GridPos): GridPos {
	return {
		x: a.x + b.x,
		y: a.y + b.y
	};
}

function mulPos(a: GridPos, b: GridPos): GridPos {
	return {
		x: a.x * b.x,
		y: a.y * b.y
	};
}

function equalPos(a: GridPos, b: GridPos) {
	return a.x === b.x && a.y === b.y;
}

function posDistance(a: GridPos, b: GridPos) {
	return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

type PickerStrategy = (max: number) => number;

function randInt(min: number, max: number) {
	const range = max - min;
	const n = range * Math.random();
	return min + Math.round(n);
}

function randSort<T>(arr: T[]) {
	arr.sort((_a, _b) => Math.random() > 0.5 ? -1 : 1);
	return arr;
}

class Grid {
	private data_: Cell[];
	private width_: number;
	private height_: number;

	constructor(width: number, height: number) {
		this.width_ = width;
		this.height_ = height;
		this.data_ = new Array(width * height).fill(0);
	}

	offset(x: number, y: number) {
		return (y * this.width_) + x;
	}

	get(x: number, y: number) {
		return this.data_[(y * this.width_) + x];
	}

	set(x: number, y: number, v: number) {
		this.data_[(y * this.width_) + x] = v;
	}

	addDir(x: number, y: number, d: Dir) {
		this.set(x, y, this.get(x, y) | d);
	}

	build(picker: PickerStrategy) {
		const { width_: w, height_: h } = this;
		const stack: GridPos[] = [];
		this.data_.fill(0);
		const [ix, iy] = [w >> 1, h >> 1]; // [randInt(0, w - 1), randInt(0, h - 1)];
		stack.push({ x: ix, y: iy });

		while (stack.length) {
			const index = picker(stack.length - 1);
			let deadend = true;
			const { x, y } = stack[index];

			for (const dir of randSort([Dir.N, Dir.E, Dir.S, Dir.W])) {
				const [nx, ny] = [x + dirDX.get(dir)!, y + dirDY.get(dir)!];
				if (nx >= 0 && ny >= 0 && nx < w && ny < h && this.get(nx, ny) === 0) {
					this.addDir(x, y, dir);
					this.addDir(nx, ny, reverseDir.get(dir)!);
					stack.push({ x: nx, y: ny });
					deadend = false;
					break;
				}
			}

			if (deadend) {
				stack.splice(index, 1);
			}
		}
	}

	minDistance(pa: GridPos, pb: GridPos) {
		if (equalPos(pa, pb)) {
			return 0;
		}

		const { width_: w, height_: h } = this;
		const stack: GridPos[] = [];
		const visited = new Set<number>();
		stack.push(pa);
		visited.add(this.offset(pa.x, pa.y));
		let bestDist = w * h;

		while (stack.length) {
			let deadend = true;
			const { x, y } = stack[stack.length - 1];
			const exits = this.get(x, y);

			for (const dir of randSort([Dir.N, Dir.E, Dir.S, Dir.W])) {
				if (0 === (exits & dir)) {
					continue;
				}
				const [nx, ny] = [x + dirDX.get(dir)!, y + dirDY.get(dir)!];
				if (nx === pb.x && ny === pb.y) {
					if (stack.length < bestDist) {
						bestDist = stack.length;
					}
				}
				if (nx >= 0 && ny >= 0 && nx < w && ny < h && !visited.has(this.offset(nx, ny))) {
					stack.push({ x: nx, y: ny });
					visited.add(this.offset(nx, ny));
					deadend = false;
					break;
				}
			}

			if (deadend) {
				stack.pop();
			}
		}

		return bestDist;
	}

	each(fn: (pos: GridPos, dirs: number) => void) {
		for (let y = 0; y < this.height_; ++y) {
			for (let x = 0; x < this.width_; ++x) {
				fn({x, y}, this.get(x, y));
			}
		}
	}

	get deadends(): GridPos[] {
		const w = this.width_;
		const cells = this.data_.map((c, off) => ({ dirs: c, x: off % w, y: Math.floor(off / w) }));
		return cells.filter(c => {
			return (c.dirs === 1 || c.dirs === 2 || c.dirs === 4 || c.dirs === 8);
		});
	}

	get width() { return this.width_; }
	get height() { return this.height_; }
}

const recursiveBacktrack = (max: number) => max;
const random = (max: number) => randInt(0, max);
const threshold = (fa: PickerStrategy, fb: PickerStrategy, lim: number) => (max: number) => {
	if (Math.random() > lim) {
		return fb(max);
	}
	return fa(max);
};


class GridView {
	public WD = 10;

	constructor(public grid: Grid, public ctx: CanvasRenderingContext2D) {}

	get wallDim(): GridPos {
		return { x: this.WD, y: this.WD };
	}

	get cellWidth() {
		return (this.ctx.canvas.width - ((this.grid.width + 1) * this.WD)) / this.grid.width;
	}

	get cellHeight() {
		return (this.ctx.canvas.height - ((this.grid.height + 1) * this.WD)) / this.grid.height;
	}

	get cellDim(): GridPos {
		return {
			x: this.cellWidth,
			y: this.cellHeight
		};
	}

	get cellEffectiveDim() {
		return addPos(this.cellDim, this.wallDim);
	}

	cellTopLeft(p: GridPos) {
		return mulPos(this.cellEffectiveDim, p);
	}

	cellCentre(p: GridPos) {
		return addPos(addPos(this.cellTopLeft(p), scalePos(this.cellDim, .5)), this.wallDim);
	}
}

function render(gv: GridView, img: HTMLImageElement) {
	const ctx = gv.ctx;
	const WDH = scalePos(gv.wallDim, .5);
	ctx.strokeStyle = ctx.createPattern(img, "repeat");
	ctx.lineCap = "round";
	ctx.lineWidth = gv.WD;

	gv.grid.each((pos, dirs) => {
		const line = (a: GridPos, b: GridPos) => {
			const pa = addPos(gv.cellTopLeft(a), WDH);
			const pb = addPos(gv.cellTopLeft(b), WDH);
			ctx.beginPath();
			ctx.moveTo(pa.x, pa.y);
			ctx.lineTo(pb.x, pb.y);
			ctx.stroke();
		};
		if ((dirs & Dir.N) === 0) {
			line(pos, addPos(pos, { x: 1, y: 0 }));
		}
		if ((dirs & Dir.E) === 0) {
			line(addPos(pos, { x: 1, y: 0 }), addPos(pos, { x: 1, y: 1 }));
		}
		if ((dirs & Dir.S) === 0) {
			line(addPos(pos, { x: 0, y: 1 }), addPos(pos, { x: 1, y: 1 }));
		}
		if ((dirs & Dir.W) === 0) {
			line(pos, addPos(pos, { x: 0, y: 1 }));
		}
	});
}

function makeMaze() {
	const grid = new Grid(11, 11);
	grid.build(threshold(recursiveBacktrack, random, 0.85));
	const ctx = document.querySelector("canvas")!.getContext("2d")!;
	const gv = new GridView(grid, ctx);
	const exits = gv.grid.deadends.map(p => ({
		...p,
		dist: grid.minDistance(p, { x: 0, y: grid.height - 1 }) 
	}));
	exits.sort((a, b) => a.dist - b.dist);
	console.info(exits);
	render(gv);
}

setTimeout(makeMaze, 10);
