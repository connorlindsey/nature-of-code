import GUI from "lil-gui"
import p5 from "p5"

// const gui = new GUI()
// const debug = {}

function create2DArray(columns, rows) {
  let arr = new Array(columns)
  for (let i = 0; i < columns; i++) {
    arr[i] = new Array(rows)
    for (let j = 0; j < rows; j++) {
      arr[i][j] = 0
    }
  }
  return arr
}

new p5((p) => {
  let w = 8
  let cols, rows, board

  p.setup = () => {
    const canvas = p.createCanvas(800, 600)
    canvas.parent("gol")

    cols = p.width / w
    rows = p.height / w
    board = create2DArray(cols, rows)

    // Set random starting state
    for (let i = 1; i < cols - 1; i++) {
      for (let j = 1; j < rows - 1; j++) {
        // board[i][j] = p.floor(p.random(2))
        board[i][j] = p.floor(p.random() < 0.7 ? 1 : 0)
      }
    }

    p.frameRate(3)
  }

  p.draw = () => {
    let next = create2DArray(cols, rows)

    // Skip edges for now
    for (let i = 1; i < cols - 1; i++) {
      for (let j = 1; j < rows - 1; j++) {
        // Get neighbor count
        let neighbors = 0
        for (let k = -1; k <= 1; k++) {
          for (let l = -1; l <= 1; l++) {
            // Skip self
            if (k != 0 && l != 0) {
              neighbors += board[i + k][j + l]
            }
          }
        }

        // Rules of life
        let state = board[i][j]
        if (state === 1) {
          // 1. Alive
          if (neighbors < 2) {
            // 1a. Loneliness
            state = 0
          } else if (neighbors > 3) {
            // 1b. Overpopulation
            state = 0
          }
        } else {
          // 2. Dead
          if (neighbors === 3) {
            // 2a. Birth
            state = 1
          }
        }

        next[i][j] = state
      }
    }

    // Draw
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        p.fill(255 - board[i][j] * 255)
        p.stroke(0)
        p.square(i * w, j * w, w)
      }
    }

    board = next
  }
})
