import GUI from "lil-gui"
import p5 from "p5"

// Wave Function Collapse
// The Coding Train / Daniel Shiffman
// https://thecodingtrain.com/challenges/171-wave-function-collapse
// https://youtu.be/0zac-cDzJwA

const gui = new GUI()
let debug = {
  method: "auto",
}

const loadTrainImages = (p, tileImages) => {
  tileImages[0] = p.loadImage("/tilemaps/train-tracks/blank.png")
  tileImages[1] = p.loadImage("/tilemaps/train-tracks/up.png")
  tileImages[2] = p.loadImage("/tilemaps/train-tracks/right.png")
  tileImages[3] = p.loadImage("/tilemaps/train-tracks/down.png")
  tileImages[4] = p.loadImage("/tilemaps/train-tracks/left.png")
}

const createTrainTiles = (p, tiles, tileImages) => {
  tiles[0] = new Tile(tileImages[0], ["AAA", "AAA", "AAA", "AAA"], "blank")
  tiles[1] = new Tile(tileImages[1], ["ABA", "ABA", "AAA", "ABA"], "up")
  tiles[2] = new Tile(tileImages[2], ["ABA", "ABA", "ABA", "AAA"], "right")
  tiles[3] = new Tile(tileImages[3], ["AAA", "ABA", "ABA", "ABA"], "down")
  tiles[4] = new Tile(tileImages[4], ["ABA", "AAA", "ABA", "ABA"], "left")
}

const tiles = []
const tileImages = []
const GRID_SIZE = 24
let grid = []

new p5((p) => {
  // TODO: Restart
  p.keyReleased = () => {
    if (p.key == "Backspace") {
      console.log("Restart")
      start()
    }
  }

  gui.add(debug, "method", ["auto", "manual"]).onChange(() => {
    if (debug.method == "manual") {
      p.frameRate(0)
    } else {
      p.frameRate(60)
    }
  })

  p.preload = () => {
    loadTrainImages(p, tileImages)
  }

  p.setup = () => {
    p.createCanvas(640, 640)
    createTrainTiles(p, tiles, tileImages)
    // TODO: Rotate tiles

    // Generate adjacency rules
    for (let i = 0; i < tiles.length; i++) {
      const tile = tiles[i]
      tile.analyze(tiles)
    }
    console.log("Tiles: ", tiles)

    start()
  }

  // Set frame rate to 0 to manually step through
  p.mousePressed = () => {
    if (debug.method == "manual") {
      p.draw()
    }
  }

  const start = () => {
    // Create cells
    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
      grid[i] = new Cell(tiles.length)
    }
    p.draw()
  }

  function checkValid(arr, valid) {
    for (let i = arr.length - 1; i >= 0; i--) {
      let element = arr[i]
      if (!valid.includes(element)) {
        arr.splice(i, 1)
      }
    }
  }

  p.draw = () => {
    p.background(255)

    const w = p.width / GRID_SIZE
    const h = p.height / GRID_SIZE

    // Draw current grid
    for (let j = 0; j < GRID_SIZE; j++) {
      for (let i = 0; i < GRID_SIZE; i++) {
        let cell = grid[i + j * GRID_SIZE]
        if (cell.collapsed) {
          let option = cell.options[0]
          p.image(tiles[option].img, i * w, j * h, w, h)
        } else {
          p.fill(255)
          p.stroke(200)
          p.rect(i * w, j * h, w, h)
        }
      }
    }

    // Evaluate next grid
    let gridCopy = grid.slice()
    gridCopy = gridCopy.filter((cell) => !cell.collapsed)

    if (gridCopy.length === 0) {
      return
    }

    // Pick cell with fewest options
    gridCopy.sort((a, b) => {
      return a.options.length - b.options.length
    })

    let len = gridCopy[0].options.length
    let stopIndex = 0
    for (let i = 1; i < gridCopy.length; i++) {
      if (gridCopy[i].options.length > len) {
        stopIndex = i
        break
      }
    }
    if (stopIndex > 0) gridCopy.splice(stopIndex)

    // Collapse a cell
    const cell = p.random(gridCopy)

    cell.collapsed = true
    const pick = p.random(cell.options)

    if (pick === undefined) {
      console.log("Restart")
      start()
      return
    }
    cell.options = [pick]

    const nextGrid = []
    for (let j = 0; j < GRID_SIZE; j++) {
      for (let i = 0; i < GRID_SIZE; i++) {
        let index = i + j * GRID_SIZE
        if (grid[index].collapsed) {
          // If this cell is collapsed, just copy it over
          nextGrid[index] = grid[index]
        } else {
          // If it hasn't collapsed, evaluate its new possible neighbors
          let options = new Array(tiles.length).fill(0).map((x, i) => i)

          // Look up
          if (j > 0) {
            let up = grid[i + (j - 1) * GRID_SIZE]
            let validOptions = []
            for (let option of up.options) {
              let valid = tiles[option].down
              validOptions = validOptions.concat(valid)
            }
            checkValid(options, validOptions)
          }

          // Look right
          if (i < GRID_SIZE - 1) {
            let right = grid[i + 1 + j * GRID_SIZE]
            let validOptions = []
            for (let option of right.options) {
              let valid = tiles[option].left
              validOptions = validOptions.concat(valid)
            }
            checkValid(options, validOptions)
          }

          // Look down
          if (j < GRID_SIZE - 1) {
            let down = grid[i + (j + 1) * GRID_SIZE]
            let validOptions = []
            for (let option of down.options) {
              let valid = tiles[option].up

              validOptions = validOptions.concat(valid)
            }

            checkValid(options, validOptions)
          }

          // Look left
          if (i > 0) {
            let left = grid[i - 1 + j * GRID_SIZE]
            let validOptions = []
            for (let option of left.options) {
              let valid = tiles[option].right
              validOptions = validOptions.concat(valid)
            }
            checkValid(options, validOptions)
          }

          nextGrid[index] = new Cell(options)
        }
      }
    }

    grid = nextGrid
  }
})

class Tile {
  constructor(img, edges, name) {
    this.img = img
    this.edges = edges
    this.name = name

    // Valid neighbors
    this.up = []
    this.down = []
    this.left = []
    this.right = []
  }

  compareEdge(a, b) {
    return a === reverseStr(b)
  }

  analyze(tiles) {
    for (let i = 0; i < tiles.length; i++) {
      let tile = tiles[i]

      // Up
      if (this.compareEdge(tile.edges[2], this.edges[0])) {
        this.up.push(i)
      }

      // Right
      if (this.compareEdge(tile.edges[3], this.edges[1])) {
        this.right.push(i)
      }

      // Down
      if (this.compareEdge(tile.edges[0], this.edges[2])) {
        this.down.push(i)
      }

      // Left
      if (this.compareEdge(tile.edges[1], this.edges[3])) {
        this.left.push(i)
      }
    }
  }
}

class Cell {
  constructor(value, options) {
    this.collapsed = options?.collapsed || false

    if (value instanceof Array) {
      this.options = value
    } else {
      this.options = []
      for (let i = 0; i < value; i++) {
        this.options[i] = i
      }
    }
  }
}

// Utils
const reverseStr = (str) => str.split("").reverse().join("")
