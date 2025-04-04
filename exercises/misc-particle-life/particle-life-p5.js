import GUI from "lil-gui"
import p5 from "p5"

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//           CONFIG
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
const gui = new GUI()
const c = {
  n: 100,
  timeStep: 0.002,
  friction: 0.04,
  rMin: 0.3,
  rMax: 0.15,
  numColors: 4,
  attractionStrength: 2,
  matrix: [],
  randomWhenStopped: 0,
  spacialPartition: {
    cellCount: 5,
    draw: false,
  },
}

// TODO: Matrix presets or randomize

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
let cellSize

new p5((p) => {
  let particles = []
  let fps = p.frameRate()

  gui.add({ Restart: init }, "Restart")
  gui.add(c, "n", 10, 2000, 1).onChange(init)
  gui.add(c, "friction", 0.01, 1, 0.01)
  gui.add(c, "rMin", 0.01, 1, 0.01)
  gui.add(c, "rMax", 0.01, 0.33, 0.01)
  gui.add(c, "numColors", 1, 25, 1).onChange(init)
  gui.add(c, "attractionStrength", 1, 100, 1)
  gui.add(c, "randomWhenStopped", 0, 1, 0.01)

  const spacialPartition = gui.addFolder("Spacial Partition")
  spacialPartition.add(c.spacialPartition, "draw")

  function init() {
    // Setup spacial partitioning
    c.spacialPartition.cellCount = Math.floor(1 / c.rMax)
    cellSize = 1 / c.spacialPartition.cellCount
    grid = Array.from({ length: c.spacialPartition.cellCount }, () =>
      Array.from({ length: c.spacialPartition.cellCount }, () => []),
    )

    // Generate attraction matrix
    c.matrix = makeRandomAttractionMatrix()

    // Init particles
    particles = []
    for (let i = 0; i < c.n; i++) {
      let x = Math.random()
      let y = Math.random()
      let color = Math.floor(Math.random() * c.numColors)
      particles.push(new Particle(p, x, y, color))
    }
  }

  p.setup = () => {
    p.createCanvas(window.innerWidth, window.innerHeight)
    init()
    // p.frameRate(10)
  }

  p.windowResized = () => {
    p.resizeCanvas(window.innerWidth, window.innerHeight)
  }

  p.draw = () => {
    updateParticles()

    p.background(10)

    // Draw grid
    if (c.spacialPartition.draw) {
      p.noFill()
      p.stroke(50)
      for (let i = 0; i < c.spacialPartition.cellCount; i++) {
        for (let j = 0; j < c.spacialPartition.cellCount; j++) {
          p.rect(
            (i * p.width) / c.spacialPartition.cellCount,
            (j * p.height) / c.spacialPartition.cellCount,
            p.width / c.spacialPartition.cellCount,
            p.height / c.spacialPartition.cellCount,
          )
        }
      }
      p.noStroke()
    }

    for (let particle of particles) {
      // particle.update()
      particle.draw()
    }

    if (p.frameCount % 3 === 0) {
      fps = p.frameRate()
    }
    p.fill(255)
    p.text(`FPS: ${fps.toFixed(3)}`, 6, 16)
  }

  function updateParticles() {
    for (let i = 0; i < c.n; i++) {
      const particle = particles[i]

      // Update velocities
      let totalForceX = 0
      let totalForceY = 0

      // ! Check all other particles
      // for (let j = 0; j < c.n; j++) {
      // const adjacentParticles = [...particles]

      // * Check adjacent cells
      const adjacentParticles = []
      const cellX = particle.cell.x
      const cellY = particle.cell.y

      for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
          const checkX = cellX + x
          const checkY = cellY + y
          if (
            checkX >= 0 &&
            checkX < c.spacialPartition.cellCount &&
            checkY >= 0 &&
            checkY < c.spacialPartition.cellCount
          ) {
            adjacentParticles.push(...grid[checkY][checkX])
          }
        }
      }

      for (const other of adjacentParticles) {
        if (particle.id === other.id) continue

        const rx = other.posX - particle.posX
        const ry = other.posY - particle.posY
        const r = Math.hypot(rx, ry)

        if (r > 0 && r < c.rMax) {
          const f = force(r / c.rMax, c.matrix[particle.color][other.color])
          totalForceX += (rx / r) * f
          totalForceY += (ry / r) * f
        }
      }

      totalForceX *= c.rMax * c.attractionStrength
      totalForceY *= c.rMax * c.attractionStrength

      // Repulse from edges
      // TODO: Add back in maybe
      // const edgeMargin = 0.025
      // const edgeRepulsion = 0.00002
      // if (particle.pos.x < edgeMargin) {
      //   totalForce.add(p.createVector(edgeRepulsion, 0))
      // } else if (particle.pos.x > 1 - edgeMargin) {
      //   totalForce.add(p.createVector(-edgeRepulsion, 0))
      // }
      // if (particle.pos.y < edgeMargin) {
      //   totalForce.add(p.createVector(0, edgeRepulsion))
      // } else if (particle.pos.y > 1 - edgeMargin) {
      //   totalForce.add(p.createVector(0, -edgeRepulsion))
      // }

      // TODO: Just update position directly
      // particle.applyForce(totalForce)

      // Friction should be 0.99... etc
      particle.velX *= 1 - c.friction / 10
      particle.velY *= 1 - c.friction / 10
      particle.velX += totalForceX * c.timeStep
      particle.velY += totalForceY * c.timeStep

      // Randomly move if stopped
      // TODO: Add back in
      // const minSpeed = 0.00005
      // if (particle.vel.mag() < minSpeed) {
      //   particle.vel.add(
      //     p.createVector(Math.random() * 2 - 1, Math.random() * 2 - 1).mult(c.randomWhenStopped / 1000),
      //   )
      // }
      // particle.update()

      // ! Just velocity
      particle.posX += particle.velX * c.timeStep
      particle.posY += particle.velY * c.timeStep

      // Constrain position between 0 and 1
      // this.pos.x = Math.max(0, Math.min(1, this.pos.x))
      // this.pos.y = Math.max(0, Math.min(1, this.pos.y))

      // Wrap positions
      particle.posX = ((particle.posX % 1) + 1) % 1
      particle.posY = ((particle.posY % 1) + 1) % 1
      particle.updateCell()
    }
  }
})

class Particle {
  constructor(p, x, y, color) {
    this.id = Math.random()

    this.p = p
    // this.pos = this.p.createVector(x, y)
    // this.vel = this.p.createVector(0, 0)
    // this.acc = this.p.createVector(0, 0)
    this.posX = x
    this.posY = y
    this.color = color
    // TODO: Use mass in an interesting way to scale size and force
    // this.mass = this.p.random(0.5, 3)

    // Debug
    this.cell = {
      x: Math.floor(this.posX / cellSize),
      y: Math.floor(this.posY / cellSize),
    }
    grid[this.cell.y][this.cell.x].push(this)
  }

  // update() {
  //   // ! w/ acc
  //   // this.vel.add(this.acc)
  //   // this.vel.mult(1 - c.friction)
  //   // this.pos.add(this.vel)
  //   // this.acc.mult(0)

  //   // // Constrain position between 0 and 1
  //   // this.pos.x = Math.max(0, Math.min(1, this.pos.x))
  //   // this.pos.y = Math.max(0, Math.min(1, this.pos.y))

  //   // this.updateCell()

  // }

  updateCell() {
    // Remove last position from grid if different
    let x = this.p.constrain(Math.floor(this.posX / cellSize), 0, c.spacialPartition.cellCount - 1)
    let y = this.p.constrain(Math.floor(this.posY / cellSize), 0, c.spacialPartition.cellCount - 1)
    if (this.cell.x !== x || this.cell.y !== y) {
      // Remove from last position
      const idx = grid[this.cell.y][this.cell.x].findIndex((p) => p.id === this.id)
      grid[this.cell.y][this.cell.x].splice(idx, 1)

      // Add new position to grid
      this.cell = { x, y }
      grid[y][x].push(this)
    }
  }

  // applyForce(force) {
  //   let f = force.copy()
  //   // f.div(this.mass)
  //   this.acc.add(f)
  // }

  draw() {
    this.p.fill(`hsl(${360 * (this.color / c.numColors)}, 100%, 50%)`)
    this.p.circle(this.posX * this.p.width, this.posY * this.p.height, 8)
  }
}
