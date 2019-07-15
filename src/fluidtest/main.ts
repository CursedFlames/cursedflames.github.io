import { Pos, Cell, Tile, Tiles, TilesList, Fluid, Fluids, FluidsList } from "./util";

const url = new URL(window.location.href);
const urlParams = url.searchParams;

const defaultWidth = 40;
const defaultHeight = 30;
const defaultDegrad = 16;

let paramWidth = urlParams.get("width");
const width: number = paramWidth == null ? defaultWidth : ((+paramWidth) || defaultWidth);
let paramHeight = urlParams.get("height");
const height: number = paramHeight == null ? defaultHeight : ((+paramHeight) || defaultHeight);
let paramDegrad = urlParams.get("degrad");
const degrad: number = paramDegrad == null ? defaultDegrad : ((+paramDegrad) || defaultDegrad);
// const pressureThreshold = 12;
const restlessWater = true;

let widthInput = document.getElementById("widthInput");
if (widthInput instanceof HTMLInputElement) {
	widthInput.value = ""+width;
} else {
	console.warn("Element #widthInput is missing or is not an input. This shouldn't happen.");
}
let heightInput = document.getElementById("heightInput");
if (heightInput instanceof HTMLInputElement) {
	heightInput.value = ""+height;
} else {
	console.warn("Element #heightInput is missing or is not an input. This shouldn't happen.");
}
let degradInput = document.getElementById("degradInput");
if (degradInput instanceof HTMLInputElement) {
	degradInput.value = ""+degrad;
} else {
	console.warn("Element #degradInput is missing or is not an input. This shouldn't happen.");
}

function reloadPage() {
	urlParams.set("width", widthInput instanceof HTMLInputElement ? widthInput.value : ""+defaultWidth);
	urlParams.set("height", heightInput instanceof HTMLInputElement ? heightInput.value : ""+defaultHeight);
	urlParams.set("degrad", degradInput instanceof HTMLInputElement ? degradInput.value : ""+defaultDegrad);
	window.location.href = url.href;
}

function resetPage() {
	urlParams.delete("width");
	urlParams.delete("height");
	urlParams.delete("degrad");
	window.location.href = url.href;
}

let reloadButton = document.getElementById("reload");
if (reloadButton instanceof HTMLButtonElement) {
	reloadButton.onclick = reloadPage;
} else {
	console.warn("Element #reload is missing or is not a button. This shouldn't happen.");
}

let resetButton = document.getElementById("resetSettings");
if (resetButton instanceof HTMLButtonElement) {
	resetButton.onclick = resetPage;
} else {
	console.warn("Element #resetSettings is missing or is not a button. This shouldn't happen.");
}

console.log("Hello World!");

const fluidSim = {
	partialTicks: 0,
	cells: [] as Cell[][],
	currentTile: Tiles.GROUND as Tile | Fluid,
	isEvenTick: false
};

for (let x = 0; x < width; x++) {
	let col = [];
	for (let y = 0; y < height; y++) {
		col[y] = new Cell(Tiles.AIR);
	}
	fluidSim.cells.push(col);
}

let boardElem_ = document.getElementById("board");
if (boardElem_ == null) {
	throw new Error("board is null");
} else if (!(boardElem_ instanceof HTMLCanvasElement)) {
	throw new Error("board is not canvas");
}
let boardElem = <HTMLCanvasElement> boardElem_;
let ctx_ = boardElem.getContext("2d");
if (ctx_ == null) {
	throw new Error("canvas context is null");
}
let ctx = <CanvasRenderingContext2D> ctx_;
boardElem.setAttribute("style", 
	"position: relative; background-color: #777;");
boardElem.width = width*(degrad+1);
boardElem.height = height*(degrad+1);
boardElem.onmousemove = function(event: MouseEvent) {
	if ((event.buttons & 1) !== 1) return;
	let rect = boardElem.getBoundingClientRect();
	let clickX = event.clientX - rect.left;
	let clickY = event.clientY - rect.top;
	let x = Math.floor(clickX/(degrad+1));
	let y = Math.floor(clickY/(degrad+1));
	if (x < 0 || x >= width || y < 0 || y >= height) return;
	let cell = fluidSim.cells[x][y];

	if (fluidSim.currentTile instanceof Tile) {
		cell.tile = fluidSim.currentTile;
		if (cell.tile.solid) {
			cell.fluid = undefined;
			cell.fluidAmount = 0;
		}
	} else if (fluidSim.currentTile instanceof Fluid) {
		cell.fluid = fluidSim.currentTile;
		cell.fluidAmount = degrad;
		if (cell.tile.solid) {
			cell.tile = Tiles.AIR;
		}
	}
	redraw();
}
boardElem.onclick = boardElem.onmousemove;

let palette_ = document.getElementById("palette");
if (palette_ != null) {
	let palette = <HTMLElement> palette_;
	let addToPalette = function(tile: Tile | Fluid) {
		let div = document.createElement("div");
		div.style.backgroundColor = tile.color;
		div.onclick = function() {
			fluidSim.currentTile = tile;
			redraw();
		}
		palette.appendChild(div);
	}
	for (let i = 0; i < TilesList.length; i++) {
		let tile = TilesList[i];
		addToPalette(tile);
	}
	for (let i = 0; i < FluidsList.length; i++) {
		let tile = FluidsList[i];
		addToPalette(tile);
	}
}

function redraw() {
	let currentTile = fluidSim.currentTile;
	let palette = document.getElementById("palette");
	if (palette != null) {
		let isTile = currentTile instanceof Tile;
		let ind = isTile ? TilesList.indexOf(<Tile>currentTile) : TilesList.length+FluidsList.indexOf(<Fluid>currentTile);
		for (let i = 0; i < palette.children.length; i++) {
			let tile = palette.children[i];
			if (tile instanceof HTMLElement) {
				if (i === ind) {
					tile.style.border = "2px solid white";
					tile.style.marginBottom = "0px";
				} else {
					tile.style.border = "0px";
					tile.style.marginBottom = "2px";
				}
			}
		}
	}
	for (let x = 0; x < fluidSim.cells.length; x++) {
		let col = fluidSim.cells[x];
		for (let y = 0; y < col.length; y++) {
			let cell = col[y];
			ctx.fillStyle = cell.tile.color;
			ctx.fillRect(x*(degrad+1), y*(degrad+1), degrad, degrad);
			if (cell.fluid != null) {
				ctx.fillStyle = cell.fluid.color;
				if (cell.tile !== Tiles.AIR) {
					ctx.globalAlpha = 0.7;
				}
				if (cell.fluidAmount < degrad)
					ctx.fillRect(x*(degrad+1), y*(degrad+1)+degrad-cell.fluidAmount, degrad, cell.fluidAmount);
				else {
					//TODO stop hardcoding colors here
					let r = Math.max(0, Math.floor(0x33-(cell.fluidAmount-degrad)*3));
					let g = Math.max(0, Math.floor(0x33-(cell.fluidAmount-degrad)*3));
					let b = Math.max(0, Math.floor(0xff-(cell.fluidAmount-degrad)*15));
					ctx.fillStyle = "rgb("+r+","+g+","+b+")";
					ctx.fillRect(x*(degrad+1), y*(degrad+1), degrad, degrad);
					if (cell.fluidAmount > degrad) {
						ctx.fillStyle = "#FFF";
						ctx.fillText(""+cell.fluidAmount, x*(degrad+1), y*(degrad+1)+degrad/2);
					}
				}
				ctx.globalAlpha = 1;
			}
		}
	}
}
redraw();

let tickButton = document.getElementById("tick");
if (tickButton != null) tickButton.onclick = tick_rowbyrow;

/*function tick_simple() {
	for (let x = 0; x < fluidSim.cells.length; x++) {
		let leftCol: Cell[] | undefined = fluidSim.cells[x-1];
		let col = fluidSim.cells[x];
		let rightCol: Cell[] | undefined = fluidSim.cells[x+1];
		//loop upwards, so we can process all gravity without fluids falling infinitely fast
		for (let y = col.length-1; y >= 0; y--) {
			let cell = col[y];
			if (cell.nextDiff == null) cell.nextDiff = 0;

			let upCell: Cell | undefined = col[y-1];
			if (upCell != null && upCell.nextDiff == null) upCell.nextDiff = 0;
			let downCell: Cell | undefined = col[y+1];
			if (downCell != null && downCell.nextDiff == null) downCell.nextDiff = 0;
			if (cell.fluid == null) continue;
			if (downCell == null) {
				//void fluids that exit the grid
				// cell.fluid = undefined;
				cell.nextDiff = -1000;
				continue;
			}

			//don't need this, but typescript yells at us if we don't have it
			if (downCell.nextDiff == null) downCell.nextDiff = 0;

			if (downCell.fluid == null && !downCell.tile.solid) { //transfer all fluid in cell
				downCell.fluid = cell.fluid;
				downCell.nextDiff += cell.fluidAmount;
				// cell.fluid = undefined;
				cell.nextDiff -= cell.fluidAmount;
				continue;
			}

			let cellFluidLeft = cell.fluidAmount;
			let isCellCompressed = false;
			if (upCell != null) {
				if (upCell.fluidAmount >= degrad) {
					if (cell.fluidAmount > upCell.fluidAmount) {
						isCellCompressed = true;
					}
				}
			}

			let downCellMax = Math.max(degrad, cell.fluidAmount + (isCellCompressed ? 1 : 2));
			if (downCell.fluidAmount < downCellMax && downCell.fluid == cell.fluid) { // TODO different fluid merge rules?
				// let transferred = Math.min(downCellMax - (downCell.fluidAmount+downCell.nextDiff), cell.fluidAmount);
				let transferred = 0;
				if (downCell.fluidAmount < degrad) {
					transferred = degrad-(downCell.fluidAmount);
				} else if (downCellMax - (downCell.fluidAmount) > 0) {
					transferred = 1;
				}
				if (transferred > 0) {
					downCell.nextDiff += transferred;
					if (cell.fluidAmount > transferred) {
						cell.nextDiff -= transferred;//totalFluid - downCellMax;
						cellFluidLeft -= transferred;
					} else {
						cell.nextDiff -= transferred;//cell.fluidAmount;
						// cell.fluid = undefined;
						continue;
					}
				}
			}

			let leftCell: Cell | undefined = leftCol == null ? undefined : leftCol[y];
			if (leftCell != null && leftCell.nextDiff == null) leftCell.nextDiff = 0;
			let rightCell: Cell | undefined = rightCol == null ? undefined : rightCol[y];
			if (rightCell != null && rightCell.nextDiff == null) rightCell.nextDiff = 0;

			if (downCell == null || !(downCell.tile.solid||downCell.fluidAmount>=degrad)) continue;

			if (leftCell == null || leftCell.tile.solid
					|| (leftCell.fluid != null && leftCell.fluid !== cell.fluid) || leftCell.fluidAmount >= cellFluidLeft) {
				if (rightCell == null || rightCell.tile.solid ||
						(rightCell.fluid != null && rightCell.fluid !== cell.fluid) || rightCell.fluidAmount >= cellFluidLeft) {
					//continue;
				} else {
					//don't need this, but typescript yells at us if we don't have it
					if (rightCell.nextDiff == null) rightCell.nextDiff = 0;

					let totalFluid = cellFluidLeft + rightCell.fluidAmount;
					let transferred = (restlessWater?Math.ceil(totalFluid/2):Math.floor(totalFluid/2))-rightCell.fluidAmount;
					cell.nextDiff -= transferred;
					cellFluidLeft -= transferred;
					rightCell.nextDiff += (restlessWater?Math.ceil(totalFluid/2):Math.floor(totalFluid/2))-rightCell.fluidAmount;
					rightCell.fluid = cell.fluid;
				}
			} else {
				//don't need this, but typescript yells at us if we don't have it
				if (leftCell.nextDiff == null) leftCell.nextDiff = 0;

				if (rightCell == null || rightCell.tile.solid ||
						(rightCell.fluid != null && rightCell.fluid !== cell.fluid) || rightCell.fluidAmount >= cellFluidLeft) {
					let totalFluid = cellFluidLeft + leftCell.fluidAmount;
					let transferred = (restlessWater?Math.ceil(totalFluid/2):Math.floor(totalFluid/2))-leftCell.fluidAmount;
					cell.nextDiff -= transferred;
					cellFluidLeft -= transferred;
					leftCell.nextDiff += (restlessWater?Math.ceil(totalFluid/2):Math.floor(totalFluid/2))-leftCell.fluidAmount;
					leftCell.fluid = cell.fluid;
				} else {
					//don't need this, but typescript yells at us if we don't have it
					if (rightCell.nextDiff == null) rightCell.nextDiff = 0;

					let newLeft = leftCell.fluidAmount;
					let newRight = rightCell.fluidAmount;
					let cellTransferred = 0;
					while (newLeft < cellFluidLeft || newRight < cellFluidLeft) {
						if (newLeft < newRight || (newLeft === newRight && Math.random()<0.5)) {
							newLeft++;
						} else {
							newRight++;
						}
						cellFluidLeft--;
						cellTransferred++;
					}
					cell.nextDiff -= cellTransferred;
					cellFluidLeft -= cellTransferred;
					leftCell.nextDiff += newLeft - leftCell.fluidAmount;
					leftCell.fluid = cell.fluid;
					rightCell.nextDiff += newRight - rightCell.fluidAmount;
					rightCell.fluid = cell.fluid;
				}
			}
			// if (cellFluidLeft > degrad) {
			// 	if (upCell == null || upCell.tile.solid || (upCell.fluid != null && upCell.fluid !== cell.fluid)) continue;

			// 	let upCellAmount = upCell.fluidAmount == null ? 0 : upCell.fluidAmount;
			// 	let maxTransfer = cellFluidLeft - degrad;
			// 	let transfer = 0;
			// 	while (upCellAmount+transfer+2 < cellFluidLeft-transfer && cellFluidLeft-transfer > degrad) {
			// 		transfer++;
			// 	}
			// 	//don't need this, but typescript yells at us if we don't have it
			// 	if (upCell.nextDiff == null) upCell.nextDiff = 0;
			// 	upCell.nextDiff += transfer;
			// 	upCell.fluid = cell.fluid;
			// 	cell.nextDiff -= transfer;
			// }
		}
	}

	for (let x = 0; x < fluidSim.cells.length; x++) {
		let col = fluidSim.cells[x];
		for (let y = col.length-1; y >= 0; y--) {
			let cell = col[y];
			if (cell != null && cell.nextDiff != null) {
				cell.fluidAmount = Math.max(0, cell.fluidAmount+cell.nextDiff);
				cell.nextDiff = undefined;
				if (cell.fluidAmount === 0) {
					cell.fluid = undefined;
				}
			}
		}
	}
	redraw();
}*/

function rowbyrow_cell(x: number, y: number) {
	let cell = fluidSim.cells[x][y];

	if (cell.fluid == null) return;

	let upCell: Cell | undefined = fluidSim.cells[x][y-1];
	let downCell: Cell | undefined = fluidSim.cells[x][y+1];
	let leftCell: Cell | undefined = fluidSim.cells[x-1] == null ? undefined : fluidSim.cells[x-1][y];
	let rightCell: Cell | undefined = fluidSim.cells[x+1] == null ? undefined : fluidSim.cells[x+1][y];

	if (cell.nextDiff == null) cell.nextDiff = 0;

	if (upCell != null && upCell.nextDiff == null) upCell.nextDiff = 0;
	if (leftCell != null && leftCell.nextDiff == null) leftCell.nextDiff = 0;
	if (rightCell != null && rightCell.nextDiff == null) rightCell.nextDiff = 0;

	//gravity
	if (downCell == null) {
		//void fluids that exit the grid
//		cell.fluid = undefined;
		cell.nextDiff = -1000;
		return;
	}

	if (downCell.nextDiff == null) downCell.nextDiff = 0;

	if (downCell.fluid == null && !downCell.tile.solid) { //transfer all fluid in cell
		downCell.fluid = cell.fluid;
		downCell.nextDiff += cell.fluidAmount;
//		cell.fluid = undefined;
		cell.nextDiff -= cell.fluidAmount;
		return;
	}

	let cellFluidLeft = cell.fluidAmount;
	let isCellCompressed = false;
	if (upCell != null) {
		if (upCell.fluidAmount >= degrad) {
			if (cell.fluidAmount > upCell.fluidAmount) {
				isCellCompressed = true;
			}
		}
	}

	let downCellMax = Math.max(degrad, cell.fluidAmount + (isCellCompressed ? 1 : 2));
	if (downCell.fluidAmount < downCellMax && downCell.fluid == cell.fluid) { // TODO different fluid merge rules?
//		let transferred = Math.min(downCellMax - (downCell.fluidAmount+downCell.nextDiff), cell.fluidAmount);
		let transferred = 0;
		if (downCell.fluidAmount < degrad) {
			transferred = degrad-(downCell.fluidAmount);
		} else if (downCellMax - (downCell.fluidAmount) > 0) {
			transferred = 1;
		}
		if (transferred > 0) {
			downCell.nextDiff += transferred;
			if (cell.fluidAmount > transferred) {
				cell.nextDiff -= transferred;//totalFluid - downCellMax;
				cellFluidLeft -= transferred;
			} else {
				cell.nextDiff -= transferred;//cell.fluidAmount;
//				cell.fluid = undefined;
				return;
			}
		}
	}


	//horizontal water spread
	if (leftCell == null || leftCell.tile.solid
			|| (leftCell.fluid != null && leftCell.fluid !== cell.fluid) || leftCell.fluidAmount >= cellFluidLeft) {
		if (rightCell == null || rightCell.tile.solid ||
				(rightCell.fluid != null && rightCell.fluid !== cell.fluid) || rightCell.fluidAmount >= cellFluidLeft) {
			//continue;
		} else {
			//don't need this, but typescript yells at us if we don't have it
			if (rightCell.nextDiff == null) rightCell.nextDiff = 0;

			let totalFluid = cellFluidLeft + rightCell.fluidAmount;
			let transferred = (restlessWater?Math.ceil(totalFluid/2):Math.floor(totalFluid/2))-rightCell.fluidAmount;
			cell.nextDiff -= transferred;
			cellFluidLeft -= transferred;
			rightCell.nextDiff += (restlessWater?Math.ceil(totalFluid/2):Math.floor(totalFluid/2))-rightCell.fluidAmount;
			rightCell.fluid = cell.fluid;
		}
	} else {
		//don't need this, but typescript yells at us if we don't have it
		if (leftCell.nextDiff == null) leftCell.nextDiff = 0;

		if (rightCell == null || rightCell.tile.solid ||
				(rightCell.fluid != null && rightCell.fluid !== cell.fluid) || rightCell.fluidAmount >= cellFluidLeft) {
			let totalFluid = cellFluidLeft + leftCell.fluidAmount;
			let transferred = (restlessWater?Math.ceil(totalFluid/2):Math.floor(totalFluid/2))-leftCell.fluidAmount;
			cell.nextDiff -= transferred;
			cellFluidLeft -= transferred;
			leftCell.nextDiff += (restlessWater?Math.ceil(totalFluid/2):Math.floor(totalFluid/2))-leftCell.fluidAmount;
			leftCell.fluid = cell.fluid;
		} else {
			//don't need this, but typescript yells at us if we don't have it
			if (rightCell.nextDiff == null) rightCell.nextDiff = 0;

			let newLeft = leftCell.fluidAmount;
			let newRight = rightCell.fluidAmount;
			let cellTransferred = 0;
			while (newLeft < cellFluidLeft || newRight < cellFluidLeft) {
				if (newLeft < newRight || (newLeft === newRight && Math.random()<0.5)) {
					newLeft++;
				} else {
					newRight++;
				}
				cellFluidLeft--;
				cellTransferred++;
			}
			cell.nextDiff -= cellTransferred;
			cellFluidLeft -= cellTransferred;
			leftCell.nextDiff += newLeft - leftCell.fluidAmount;
			leftCell.fluid = cell.fluid;
			rightCell.nextDiff += newRight - rightCell.fluidAmount;
			rightCell.fluid = cell.fluid;
		}
	}


	//upwards flow due to pressure
	if (cellFluidLeft > degrad) {
		if (upCell == null || upCell.tile.solid || (upCell.fluid != null && upCell.fluid !== cell.fluid)) return;

		let upCellAmount = upCell.fluidAmount == null ? 0 : upCell.fluidAmount;
		let maxTransfer = cellFluidLeft - degrad;
		let transfer = 0;
		while (upCellAmount+transfer < cellFluidLeft-transfer && cellFluidLeft-transfer > degrad) {
			transfer++;
		}
//		console.log("cell: " + cellFluidLeft + " up: " + upCellAmount + ", transferring " + transfer);
		//don't need this, but typescript yells at us if we don't have it
		if (upCell.nextDiff == null) upCell.nextDiff = 0;
		upCell.nextDiff += transfer;
		upCell.fluid = cell.fluid;
		cell.nextDiff -= transfer;
	}
}

function tick_rowbyrow() {
	for (let y = fluidSim.cells[0].length-1; y >= 0; y--) {
		if (fluidSim.isEvenTick) {
			for (let x = 0; x < fluidSim.cells.length; x++) {
				rowbyrow_cell(x, y);
			}
		} else {
			for (let x = fluidSim.cells.length-1; x >= 0; x--) {
				rowbyrow_cell(x, y);
			}
		}
		for (let x = 0; x < fluidSim.cells.length; x++) {
			let cell = fluidSim.cells[x][y];
			let down = fluidSim.cells[x][y+1];
			let up = fluidSim.cells[x][y-1];
			if (cell != null && cell.fluid != null && cell.nextDiff != null) {
				cell.fluidAmount += cell.nextDiff;
				if (cell.fluidAmount <= 0) cell.fluid = undefined;
				cell.nextDiff = undefined;
			}
			if (down != null && down.fluid != null && down.nextDiff != null) {
				down.fluidAmount += down.nextDiff;
				if (down.fluidAmount <= 0) down.fluid = undefined;
				down.nextDiff = undefined;
			}
			if (up != null && up.fluid != null && up.nextDiff != null) {
				up.fluidAmount += up.nextDiff;
				if (up.fluidAmount <= 0) up.fluid = undefined;
				up.nextDiff = undefined;
			}
		}
	}

	fluidSim.isEvenTick = !fluidSim.isEvenTick;
	redraw();
}