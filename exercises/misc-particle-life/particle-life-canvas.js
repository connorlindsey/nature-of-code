import GUI from "lil-gui"

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//          SETUP
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
const canvas = document.getElementById("canvas")
const ctx = canvas.getContext("2d")

function resizeCanvas() {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
}
resizeCanvas()
window.addEventListener("resize", resizeCanvas)

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//           CONFIG
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
const gui = new GUI()
const c = {
  n: 5,
  timeStep: 0.002,
  frictionHalfLife: 0.4,
  rMin: 0.3,
  rMax: 0.1,
  numColors: 6,
  attractionStrength: 2,
  matrix: [],
  randomWhenStopped: 0.05,
  spacialPartition: {
    cellCount: 5,
    draw: true,
  },
}

let frictionFactor = Math.pow(0.5, c.timeStep / c.frictionHalfLife)

gui.add({ Restart: init }, "Restart")
gui.add(c, "n", 50, 200, 1).onChange(init)
gui.add(c, "timeStep", 0.001, 0.01, 0.001)
gui.add(c, "frictionHalfLife", 0.1, 1, 0.1).onChange(() => {
  frictionFactor = Math.pow(0.5, c.timeStep / c.frictionHalfLife)
})
gui.add(c, "rMin", 0.01, 1, 0.01)
gui.add(c, "rMax", 0.01, 0.25, 0.01)
gui.add(c, "numColors", 1, 25, 1).onChange(init)
gui.add(c, "attractionStrength", 1, 10, 1)
gui.add(c, "randomWhenStopped", 0, 0.1, 0.01)

const spacialPartition = gui.addFolder("Spacial Partition")
spacialPartition.add(c.spacialPartition, "draw")

// TODO: Matrix presets

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//          UTILS
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
function makeRandomAttractionMatrix() {
  const rows = []
  for (let i = 0; i < c.numColors; i++) {
    const row = []
    for (let j = 0; j < c.numColors; j++) {
      // 1. Purely random
      // row.push(Math.random() * 2 - 1)

      // 2. Not towards 0
      row.push(Math.random() < 0.5 ? -1 + Math.random() * 0.7 : 0.3 + Math.random() * 0.7)
    }
    rows.push(row)
  }
  return rows
}

function force(r, a) {
  const beta = c.rMin
  if (r < beta) {
    return r / beta - 1
  } else if (beta < r && r < 1) {
    return a * (1 - Math.abs(2 * r - 1 - beta) / (1 - beta))
  } else {
    return 0
  }
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//          MAIN
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

let grid = []
const colors = new Int32Array(c.n)
const positionsX = new Float32Array(c.n)
const positionsY = new Float32Array(c.n)
const velocitiesX = new Float32Array(c.n)
const velocitiesY = new Float32Array(c.n)

function init() {
  grid = Array.from({ length: c.spacialPartition.cellCount }, () =>
    Array.from({ length: c.spacialPartition.cellCount }, () => []),
  )
  c.matrix = makeRandomAttractionMatrix()
  for (let i = 0; i < c.n; i++) {
    colors[i] = Math.floor(Math.random() * c.numColors)
    positionsX[i] = Math.random()
    positionsY[i] = Math.random()
    velocitiesX[i] = 0
    velocitiesY[i] = 0
  }
}
init()

function updateParticles() {
  for (let i = 0; i < c.n; i++) {
    // Update velocities
    for (let i = 0; i < c.n; i++) {
      let totalForceX = 0
      let totalForceY = 0

      for (let j = 0; j < c.n; j++) {
        if (i === j) continue

        const rx = positionsX[j] - positionsX[i]
        const ry = positionsY[j] - positionsY[i]
        const r = Math.hypot(rx, ry)

        if (r > 0 && r < c.rMax) {
          const f = force(r / c.rMax, c.matrix[colors[i]][colors[j]])
          totalForceX += (rx / r) * f
          totalForceY += (ry / r) * f
        }
      }

      totalForceX *= c.rMax * c.attractionStrength
      totalForceY *= c.rMax * c.attractionStrength

      // Repulse from edges
      const edgeMargin = 0.01
      const edgeRepulsion = 0.1
      if (positionsX[i] < edgeMargin) {
        totalForceX += edgeRepulsion
      } else if (positionsX[i] > 1 - edgeMargin) {
        totalForceX -= edgeRepulsion
      }
      if (positionsY[i] < edgeMargin) {
        totalForceY += edgeRepulsion
      } else if (positionsY[i] > 1 - edgeMargin) {
        totalForceY -= edgeRepulsion
      }

      velocitiesX[i] *= frictionFactor
      velocitiesY[i] *= frictionFactor

      velocitiesX[i] += totalForceX * c.timeStep
      velocitiesY[i] += totalForceY * c.timeStep
    }

    // Randomly move if stopped
    const minSpeed = 0.01
    if (Math.abs(velocitiesX[i]) < minSpeed && Math.abs(velocitiesY[i]) < minSpeed) {
      velocitiesX[i] = (Math.random() * 2 - 1) * c.randomWhenStopped
      velocitiesY[i] = (Math.random() * 2 - 1) * c.randomWhenStopped
    }

    // Update positions
    for (let i = 0; i < c.n; i++) {
      positionsX[i] += velocitiesX[i] * c.timeStep
      positionsY[i] += velocitiesY[i] * c.timeStep

      // TODO: Make based on wrap setting
      // Constrain positions
      // TODO: Move away from edges
      positionsX[i] = Math.max(0, Math.min(positionsX[i], 1))
      positionsY[i] = Math.max(0, Math.min(positionsY[i], 1))

      // Wrap positions
      // positionsX[i] = ((positionsX[i] % 1) + 1) % 1
      // positionsY[i] = ((positionsY[i] % 1) + 1) % 1
    }
  }
}

let frameCount = 0

function loop() {
  // Update particles
  updateParticles()

  if (frameCount % 100 !== 0) {
    frameCount++
    requestAnimationFrame(loop)
    return
  }
  console.table(grid)

  // Draw background
  ctx.fillStyle = "black"
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  if (c.spacialPartition.draw) {
    // Draw grid
    ctx.strokeStyle = "rgba(128, 128, 128, 0.5)"
    const cellWidth = canvas.width / c.spacialPartition.cellCount
    const cellHeight = canvas.height / c.spacialPartition.cellCount
    for (let i = 0; i < c.spacialPartition.cellCount; i++) {
      for (let j = 0; j < c.spacialPartition.cellCount; j++) {
        ctx.strokeRect(i * cellWidth, j * cellHeight, cellWidth, cellHeight)
      }
    }
  }

  // Draw particles

  for (let i = 0; i < c.n; i++) {
    ctx.beginPath()
    const screenX = positionsX[i] * canvas.width
    const screenY = positionsY[i] * canvas.height
    ctx.arc(screenX, screenY, 4, 0, Math.PI * 2)
    ctx.fillStyle = `hsl(${360 * (colors[i] / c.numColors)}, 100%, 50%)`
    ctx.fill()
  }

  frameCount++

  requestAnimationFrame(loop)
}

requestAnimationFrame(loop)
