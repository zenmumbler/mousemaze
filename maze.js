"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var reverseDir = new Map([
    [1, 4],
    [2, 8],
    [4, 1],
    [8, 2]
]);
var dirDX = new Map([
    [1, 0],
    [2, 1],
    [4, 0],
    [8, -1]
]);
var dirDY = new Map([
    [1, -1],
    [2, 0],
    [4, 1],
    [8, 0]
]);
function scalePos(p, s) {
    return {
        x: p.x * s,
        y: p.y * s
    };
}
function addPos(a, b) {
    return {
        x: a.x + b.x,
        y: a.y + b.y
    };
}
function mulPos(a, b) {
    return {
        x: a.x * b.x,
        y: a.y * b.y
    };
}
function equalPos(a, b) {
    return a.x === b.x && a.y === b.y;
}
function posDistance(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}
function randInt(min, max) {
    var range = max - min;
    var n = range * Math.random();
    return min + Math.round(n);
}
function randSort(arr) {
    arr.sort(function (_a, _b) { return Math.random() > 0.5 ? -1 : 1; });
    return arr;
}
var Grid = (function () {
    function Grid(width, height) {
        this.width_ = width;
        this.height_ = height;
        this.data_ = new Array(width * height).fill(0);
    }
    Grid.prototype.offset = function (x, y) {
        return (y * this.width_) + x;
    };
    Grid.prototype.get = function (x, y) {
        return this.data_[(y * this.width_) + x];
    };
    Grid.prototype.set = function (x, y, v) {
        this.data_[(y * this.width_) + x] = v;
    };
    Grid.prototype.addDir = function (x, y, d) {
        this.set(x, y, this.get(x, y) | d);
    };
    Grid.prototype.build = function (picker) {
        var _c = this, w = _c.width_, h = _c.height_;
        var stack = [];
        this.data_.fill(0);
        var _d = [w >> 1, h >> 1], ix = _d[0], iy = _d[1];
        stack.push({ x: ix, y: iy });
        while (stack.length) {
            var index = picker(stack.length - 1);
            var deadend = true;
            var _e = stack[index], x = _e.x, y = _e.y;
            for (var _i = 0, _f = randSort([1, 2, 4, 8]); _i < _f.length; _i++) {
                var dir = _f[_i];
                var _g = [x + dirDX.get(dir), y + dirDY.get(dir)], nx = _g[0], ny = _g[1];
                if (nx >= 0 && ny >= 0 && nx < w && ny < h && this.get(nx, ny) === 0) {
                    this.addDir(x, y, dir);
                    this.addDir(nx, ny, reverseDir.get(dir));
                    stack.push({ x: nx, y: ny });
                    deadend = false;
                    break;
                }
            }
            if (deadend) {
                stack.splice(index, 1);
            }
        }
    };
    Grid.prototype.minDistance = function (pa, pb) {
        if (equalPos(pa, pb)) {
            return 0;
        }
        var _c = this, w = _c.width_, h = _c.height_;
        var stack = [];
        var visited = new Set();
        stack.push(pa);
        visited.add(this.offset(pa.x, pa.y));
        var bestDist = w * h;
        while (stack.length) {
            var deadend = true;
            var _d = stack[stack.length - 1], x = _d.x, y = _d.y;
            var exits = this.get(x, y);
            for (var _i = 0, _e = randSort([1, 2, 4, 8]); _i < _e.length; _i++) {
                var dir = _e[_i];
                if (0 === (exits & dir)) {
                    continue;
                }
                var _f = [x + dirDX.get(dir), y + dirDY.get(dir)], nx = _f[0], ny = _f[1];
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
    };
    Grid.prototype.each = function (fn) {
        for (var y = 0; y < this.height_; ++y) {
            for (var x = 0; x < this.width_; ++x) {
                fn({ x: x, y: y }, this.get(x, y));
            }
        }
    };
    Object.defineProperty(Grid.prototype, "deadends", {
        get: function () {
            var w = this.width_;
            var cells = this.data_.map(function (c, off) { return ({ dirs: c, x: off % w, y: Math.floor(off / w) }); });
            return cells.filter(function (c) {
                return (c.dirs === 1 || c.dirs === 2 || c.dirs === 4 || c.dirs === 8);
            });
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Grid.prototype, "width", {
        get: function () { return this.width_; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Grid.prototype, "height", {
        get: function () { return this.height_; },
        enumerable: true,
        configurable: true
    });
    return Grid;
}());
var recursiveBacktrack = function (max) { return max; };
var random = function (max) { return randInt(0, max); };
var threshold = function (fa, fb, lim) { return function (max) {
    if (Math.random() > lim) {
        return fb(max);
    }
    return fa(max);
}; };
var GridView = (function () {
    function GridView(grid, ctx) {
        this.grid = grid;
        this.ctx = ctx;
        this.WD = 10;
    }
    Object.defineProperty(GridView.prototype, "wallDim", {
        get: function () {
            return { x: this.WD, y: this.WD };
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GridView.prototype, "cellWidth", {
        get: function () {
            return (this.ctx.canvas.width - ((this.grid.width + 1) * this.WD)) / this.grid.width;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GridView.prototype, "cellHeight", {
        get: function () {
            return (this.ctx.canvas.height - ((this.grid.height + 1) * this.WD)) / this.grid.height;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GridView.prototype, "cellDim", {
        get: function () {
            return {
                x: this.cellWidth,
                y: this.cellHeight
            };
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GridView.prototype, "cellEffectiveDim", {
        get: function () {
            return addPos(this.cellDim, this.wallDim);
        },
        enumerable: true,
        configurable: true
    });
    GridView.prototype.cellTopLeft = function (p) {
        return mulPos(this.cellEffectiveDim, p);
    };
    GridView.prototype.cellCentre = function (p) {
        return addPos(addPos(this.cellTopLeft(p), scalePos(this.cellDim, .5)), this.wallDim);
    };
    return GridView;
}());
function render(gv, img) {
    var ctx = gv.ctx;
    var WDH = scalePos(gv.wallDim, .5);
    ctx.strokeStyle = ctx.createPattern(img, "repeat");
    ctx.lineCap = "round";
    ctx.lineWidth = gv.WD;
    gv.grid.each(function (pos, dirs) {
        var line = function (a, b) {
            var pa = addPos(gv.cellTopLeft(a), WDH);
            var pb = addPos(gv.cellTopLeft(b), WDH);
            ctx.beginPath();
            ctx.moveTo(pa.x, pa.y);
            ctx.lineTo(pb.x, pb.y);
            ctx.stroke();
        };
        if ((dirs & 1) === 0) {
            line(pos, addPos(pos, { x: 1, y: 0 }));
        }
        if ((dirs & 2) === 0) {
            line(addPos(pos, { x: 1, y: 0 }), addPos(pos, { x: 1, y: 1 }));
        }
        if ((dirs & 4) === 0) {
            line(addPos(pos, { x: 0, y: 1 }), addPos(pos, { x: 1, y: 1 }));
        }
        if ((dirs & 8) === 0) {
            line(pos, addPos(pos, { x: 0, y: 1 }));
        }
    });
}
var state;
function loadImage(src) {
    return new Promise(function (resolve, reject) {
        var img = new Image();
        img.onload = function () { return resolve(img); };
        img.onerror = function () { return reject("fail"); };
        img.src = src;
    });
}
function main() {
    var GRID_SIZE;
    var sizeArg = location.search.substr(1).toLowerCase() || "m";
    switch (sizeArg) {
        case "s":
            GRID_SIZE = 5;
            break;
        case "m":
            GRID_SIZE = 7;
            break;
        case "l":
            GRID_SIZE = 9;
            break;
        case "xl":
            GRID_SIZE = 11;
            break;
        default:
            GRID_SIZE = 7;
            break;
    }
    var grid = new Grid(GRID_SIZE, GRID_SIZE);
    grid.build(threshold(recursiveBacktrack, random, 0.85));
    var starts = grid.deadends.map(function (p) { return (__assign({}, p, { dist: grid.minDistance({ x: 0, y: grid.height - 1 }, p) })); });
    starts.sort(function (a, b) { return a.dist - b.dist; });
    var start = starts.shift();
    var exits = grid.deadends.map(function (p) { return (__assign({}, p, { dist: grid.minDistance(start, p) })); });
    exits.sort(function (a, b) { return a.dist - b.dist; });
    var target = exits.pop();
    var ctx = document.querySelector("canvas").getContext("2d");
    var view = new GridView(grid, ctx);
    state = {
        ctx: ctx,
        mouse: document.querySelector("#mouse"),
        cheese: document.querySelector("#cheese"),
        grid: grid,
        view: view,
        target: target,
        positions: [start],
        playerDir: 4
    };
    loadImage("img/wood.png").then(function (img) {
        render(view, img);
    });
    var mousePos = view.cellCentre(start);
    state.mouse.className = "obj obj" + GRID_SIZE;
    state.mouse.style.left = mousePos.x + "px";
    state.mouse.style.top = mousePos.y + "px";
    var exitPos = view.cellCentre(target);
    state.cheese.className = "obj obj" + GRID_SIZE;
    state.cheese.style.left = exitPos.x + "px";
    state.cheese.style.top = exitPos.y + "px";
}
main();
