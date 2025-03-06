import GUI from "lil-gui"
import p5 from "p5"

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//           CONFIG
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
const gui = new GUI()
const c = {
  n: 100,
  timeStep: 0.2,
  frictionHalfLife: 0.5,
  rMin: 0.3,
  rMax: 0.25,
  numColors: 4,
  attractionStrength: 25,
  matrix: [],
  randomWhenStopped: 0.05,
  spacialPartition: {
    cellCount: 5,
    draw: true,
  },
}

let frictionFactor = Math.pow(0.5, c.timeStep / c.frictionHalfLife)

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

new p5((p) => {
  let grid = []
  let particles = []

  gui.add({ Restart: init }, "Restart")
  gui.add(c, "n", 50, 200, 1).onChange(init)
  // gui.add(c, "timeStep", 0.001, 0.01, 0.001)
  // gui.add(c, "frictionHalfLife", 0.1, 1, 0.1).onChange(() => {
  //   frictionFactor = Math.pow(0.5, c.timeStep / c.frictionHalfLife)
  // })
  gui.add(c, "rMin", 0.01, 1, 0.01)
  gui.add(c, "rMax", 0.01, 0.5, 0.01)
  gui.add(c, "numColors", 1, 25, 1).onChange(init)
  gui.add(c, "attractionStrength", 1, 100, 1)
  gui.add(c, "randomWhenStopped", 0, 0.1, 0.01)

  const spacialPartition = gui.addFolder("Spacial Partition")
  spacialPartition.add(c.spacialPartition, "draw")

  function init() {
    particles = []
    grid = Array.from({ length: c.spacialPartition.cellCount }, () =>
      Array.from({ length: c.spacialPartition.cellCount }, () => []),
    )
    c.matrix = makeRandomAttractionMatrix()
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
    // p.frameRate(30)
  }

  p.windowResized = () => {
    p.resizeCanvas(window.innerWidth, window.innerHeight)
  }

  p.draw = () => {
    updateParticles()

    p.background(10)

    for (let particle of particles) {
      particle.update()
      particle.draw()
    }
  }

  function updateParticles() {
    for (let i = 0; i < c.n; i++) {
      const particle = particles[i]

      // Update velocities
      for (let i = 0; i < c.n; i++) {
        let totalForce = p.createVector(0, 0)

        for (let j = 0; j < c.n; j++) {
          if (i === j) continue

          const other = particles[j]

          // TODO: Update
          const r = p5.Vector.sub(particle.pos, other.pos)
          const mag = r.mag()

          if (mag > 0 && mag < c.rMax) {
            const f = force(mag / c.rMax, c.matrix[particle.color][other.color])
            totalForce.add(p.createVector(r.x / mag, r.y / mag).mult(f))
          }
        }

        totalForce.mult((c.rMax * c.attractionStrength) / 100000 / 2)

        // Repulse from edges
        const edgeMargin = 0.025
        const edgeRepulsion = 0.0001
        if (particle.pos.x < edgeMargin) {
          totalForce.add(p.createVector(edgeRepulsion, 0))
        } else if (particle.pos.x > 1 - edgeMargin) {
          totalForce.add(p.createVector(-edgeRepulsion, 0))
        }
        if (particle.pos.y < edgeMargin) {
          totalForce.add(p.createVector(0, edgeRepulsion))
        } else if (particle.pos.y > 1 - edgeMargin) {
          totalForce.add(p.createVector(0, -edgeRepulsion))
        }

        particle.applyForce(totalForce)
      }

      // Randomly move if stopped
      const minSpeed = 0.00005
      if (particle.vel.mag() < minSpeed) {
        particle.applyForce(
          p.createVector(Math.random() * 2 - 1, Math.random() * 2 - 1).mult(c.randomWhenStopped),
        )
      }
    }
  }
})

class Particle {
  constructor(p, x, y, color) {
    this.p = p
    this.pos = this.p.createVector(x, y)
    this.vel = this.p.createVector(0, 0)
    this.acc = this.p.createVector(0, 0)
    this.color = color
    this.mass = 1
  }

  update() {
    this.vel.add(this.acc)
    this.vel.mult(frictionFactor)
    this.pos.add(this.vel)
    this.acc.mult(0)

    // Constrain position between 0 and 1
    this.pos.x = Math.max(0, Math.min(1, this.pos.x))
    this.pos.y = Math.max(0, Math.min(1, this.pos.y))
  }

  applyForce(force) {
    let f = force.copy()
    f.div(this.mass)
    this.acc.add(f)
  }

  draw() {
    this.p.fill(`hsl(${360 * (this.color / c.numColors)}, 100%, 50%)`)
    this.p.circle(this.pos.x * this.p.width, this.pos.y * this.p.height, 8)
  }
}
