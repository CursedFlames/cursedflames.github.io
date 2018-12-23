

export class Pos {
	constructor(public x: number, public y: number) {}
}

export class Cell {
	nextDiff?: number;
	constructor(public tile: Tile, public fluidAmount: number = 0, public fluid?: Fluid) {}
}

export class Tile {
	constructor (public color: string, public solid: boolean = false) {}
}

export const Tiles = {
	AIR: new Tile("#AAC"),
	GROUND: new Tile("#222", true)
}

export const TilesList = [Tiles.AIR, Tiles.GROUND];

export class Fluid {
	constructor(public color: string) {}
}

export const Fluids = {
	WATER: new Fluid("#3333FF")
}

export const FluidsList = [Fluids.WATER];