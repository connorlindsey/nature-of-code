import GUI from "lil-gui"
import p5 from "p5"

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//           CONFIG
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
const gui = new GUI()
gui.hide()
const cfg = {
  // Particles
  n: 1500,
  numColors: 6,
  // Forces
  attractions: [],
  rMin: 0.02,
  rMax: 0.15,
  attractionStrength: 8,
  friction: 0.2,
  timeStep: 0.0002,
  // Misc.
  debug: true,
  edgeMethod: "wrap",
  quadTreeLimit: 6,
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//           QUADTREE
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
class Point {
  constructor(x, y, userData) {
    this.x = x
    this.y = y
    this.userData = userData
  }
}

class Rectangle {
  constructor(x, y, w, h) {
    this.x = x
    this.y = y
    this.w = w
    this.h = h
  }

  contains(p) {
    return p.x >= this.x - this.w && p.x < this.x + this.w && p.y >= this.y - this.h && p.y < this.y + this.h
  }

  intersects(a) {
    return !(
      a.x - a.w > this.x + this.w ||
      a.x + a.w < this.x - this.w ||
      a.y - a.y > this.y + this.y ||
      a.y + a.y < this.y - this.y
    )
  }
}

class Circle {
  constructor(x, y, r) {
    this.x = x
    this.y = y
    this.r = r
    this.rSquared = r * r
  }

  contains(p) {
    // If distance is less than radius, it's inside the circle
    let d = Math.pow(p.x - this.x, 2) + Math.pow(p.y - this.y, 2)
    return d <= this.rSquared
  }

  intersects(range) {
    var xDist = Math.abs(range.x - this.x)
    var yDist = Math.abs(range.y - this.y)

    // radius of the circle
    var r = this.r

    var w = range.w
    var h = range.h

    var edges = Math.pow(xDist - w, 2) + Math.pow(yDist - h, 2)

    // no intersection
    if (xDist > r + w || yDist > r + h) return false

    // intersection within the circle
    if (xDist <= w || yDist <= h) return true

    // intersection on the edge of the circle
    return edges <= this.rSquared
  }
}

class Quadtree {
  constructor(p, boundary, capacity) {
    this.p = p
    this.boundary = boundary
    this.capacity = capacity
    this.points = []
    this.divided = false
  }

  insert(point) {
    if (!this.boundary.contains(point)) return false

    if (this.points.length < this.capacity) {
      this.points.push(point)
    } else {
      if (!this.divided) {
        this.subdivide()
      }

      return this.ne.insert(point) || this.nw.insert(point) || this.se.insert(point) || this.sw.insert(point)
    }
  }

  subdivide() {
    // Create subdivisions
    let x = this.boundary.x
    let y = this.boundary.y
    let w = this.boundary.w
    let h = this.boundary.h
    let ne = new Rectangle(x + w / 2, y - h / 2, w / 2, h / 2)
    this.ne = new Quadtree(this.p, ne, this.capacity)
    let nw = new Rectangle(x - w / 2, y - h / 2, w / 2, h / 2)
    this.nw = new Quadtree(this.p, nw, this.capacity)
    let se = new Rectangle(x + w / 2, y + h / 2, w / 2, h / 2)
    this.se = new Quadtree(this.p, se, this.capacity)
    let sw = new Rectangle(x - w / 2, y + h / 2, w / 2, h / 2)
    this.sw = new Quadtree(this.p, sw, this.capacity)

    // Mark as divided
    this.divided = true
  }

  queryWrapped(area, found) {
    if (!found) {
      found = []
    }

    // Normal query
    this.query(area, found)

    // Wrapping queries (if near the boundary)
    let wrapAreas = []

    if (area.x - area.r < 0) {
      // Left edge
      wrapAreas.push(new Circle(area.x + 1, area.y, area.r))
    }
    if (area.x + area.r > 1) {
      // Right edge
      wrapAreas.push(new Circle(area.x - 1, area.y, area.r))
    }
    if (area.y - area.r < 0) {
      // Top edge
      wrapAreas.push(new Circle(area.x, area.y + 1, area.r))
    }
    if (area.y + area.r > 1) {
      // Bottom edge
      wrapAreas.push(new Circle(area.x, area.y - 1, area.r))
    }

    // Corner cases
    if (area.x - area.r < 0 && area.y - area.r < 0) {
      // Top-left corner
      wrapAreas.push(new Circle(area.x + 1, area.y + 1, area.r))
    }
    if (area.x + area.r > 1 && area.y - area.r < 0) {
      // Top-right corner
      wrapAreas.push(new Circle(area.x - 1, area.y + 1, area.r))
    }
    if (area.x - area.r < 0 && area.y + area.r > 1) {
      // Bottom-left corner
      wrapAreas.push(new Circle(area.x + 1, area.y - 1, area.r))
    }
    if (area.x + area.r > 1 && area.y + area.r > 1) {
      // Bottom-right corner
      wrapAreas.push(new Circle(area.x - 1, area.y - 1, area.r))
    }

    // Query the additional wrapped areas
    for (let wrapArea of wrapAreas) {
      this.query(wrapArea, found)
    }

    return found
  }

  query(area, found) {
    if (!found) {
      found = []
    }

    if (!this.boundary.intersects(area)) {
      return
    }

    for (let p of this.points) {
      if (area.contains(p)) {
        found.push(p)
      }
    }

    if (this.divided) {
      this.ne.query(area, found)
      this.nw.query(area, found)
      this.se.query(area, found)
      this.sw.query(area, found)
    }

    return found
  }

  show() {
    // Draw boundary
    this.p.noFill()
    this.p.stroke("rgba(255, 255, 255, 0.15)")
    this.p.strokeWeight(1)

    if (this.divided) {
      this.ne.show()
      this.nw.show()
      this.se.show()
      this.sw.show()
    } else {
      this.p.rectMode(this.p.CENTER)
      this.p.rect(
        this.boundary.x * this.p.width,
        this.boundary.y * this.p.height,
        this.boundary.w * 2 * this.p.width,
        this.boundary.h * 2 * this.p.height,
      )
    }
  }
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//          UTILS
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
function makeRandomAttractionMatrix() {
  const rows = []
  for (let i = 0; i < cfg.numColors; i++) {
    const row = []
    for (let j = 0; j < cfg.numColors; j++) {
      // 1. Purely random
      // row.push(Math.random() * 2 - 1)

      // 2. Not towards 0
      row.push(Math.random() < 0.5 ? -1 + Math.random() * 0.7 : 0.3 + Math.random() * 0.7)
      // row.push(0.5)
    }
    rows.push(row)
  }
  return rows
}

function force(r, a) {
  const beta = cfg.rMin
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
  let qtree
  let particles = []
  let fps = p.frameRate()

  gui.add({ Restart: init }, "Restart")
  gui.add(cfg, "n", 10, 2000, 1).onChange(init)
  gui.add(cfg, "friction", 0.01, 1, 0.01)
  gui.add(cfg, "rMin", 0.0, 0.03, 0.001)
  gui.add(cfg, "rMax", 0.05, 0.33, 0.01)
  gui.add(cfg, "numColors", 1, 25, 1).onChange(init)
  gui.add(cfg, "edgeMethod", ["contain", "wrap"])
  gui.add(cfg, "debug")
  gui.add(cfg, "quadTreeLimit", 4, 10, 1)
  // gui.add(cfg, "attractionStrength", 1, 100, 1)
  // gui.add(c, "randomWhenStopped", 0, 1, 0.01)

  function init() {
    // Generate attraction matrix
    cfg.attractions = makeRandomAttractionMatrix()

    // Init particles
    particles = []
    for (let i = 0; i < cfg.n; i++) {
      let x = Math.random()
      let y = Math.random()
      let color = Math.floor(Math.random() * cfg.numColors)
      const particle = new Particle(p, x, y, color)
      particles.push(particle)
    }

    updateParticles()
  }

  p.setup = () => {
    p.createCanvas(window.innerWidth, window.innerHeight)
    init()
  }

  p.windowResized = () => {
    p.resizeCanvas(window.innerWidth, window.innerHeight)
  }

  p.draw = () => {
    p.background(0)
    // Update
    updateParticles()

    // Draw
    drawParticles()
    if (cfg.debug) drawDebug()
  }

  function drawParticles() {
    for (let particle of particles) {
      particle.draw()
    }
  }

  function drawDebug() {
    qtree?.show()
    if (p.frameCount % 3 === 0) {
      fps = p.frameRate()
    }
    p.fill(255)
    p.text(`FPS: ${fps.toFixed(3)}`, 6, 16)
  }

  function updateParticles() {
    // Create quadtree
    let boundary = new Rectangle(0.5, 0.5, 0.5, 0.5)
    qtree = new Quadtree(p, boundary, cfg.quadTreeLimit)
    for (let p of particles) {
      p.displayColor = undefined
      qtree.insert(new Point(p.x, p.y, p))
    }

    // Calculate forces for each particle based on neighbors
    for (let i = 0; i < cfg.n; i++) {
      const a = particles[i]

      let fx = 0
      let fy = 0

      let range = new Circle(a.x, a.y, cfg.rMax)
      let nearbyParticles =
        cfg.edgeMethod === "contain"
          ? qtree.query(range)?.map((p) => p.userData)
          : qtree.queryWrapped(range)?.map((p) => p.userData) ?? []
      if (nearbyParticles.length > cfg.n * 0.8) {
        console.log(nearbyParticles.length)
      }

      for (let b of nearbyParticles) {
        if (a === b) continue

        let rx = b.x - a.x
        let ry = b.y - a.y

        // Adjust distances for toroidal space
        if (cfg.edgeMethod === "wrap") {
          if (rx > 0.5) rx -= 1
          if (rx < -0.5) rx += 1
          if (ry > 0.5) ry -= 1
          if (ry < -0.5) ry += 1
        }

        const r = Math.hypot(rx, ry)

        if (r > 0 && r < cfg.rMax) {
          const f = force(r, cfg.attractions[a.color][b.color])
          fx += (rx / r) * f
          fy += (ry / r) * f
        }
      }

      // Scale attraction
      fx *= cfg.rMax * cfg.attractionStrength
      fy *= cfg.rMax * cfg.attractionStrength

      // Apply friction
      a.dx *= 1 - cfg.friction
      a.dy *= 1 - cfg.friction

      // Apply force
      a.dx += fx * cfg.timeStep
      a.dy += fy * cfg.timeStep

      // Update position
      const offset = 0.025

      if (a.x < offset / 2) a.dx += 0.0005
      if (a.y < offset / 2) a.dy += 0.0005

      if (cfg.edgeMethod === "contain") {
        a.x = p.constrain(a.x + a.dx, offset, 1 - offset)
        a.y = p.constrain(a.y + a.dy, offset, 1 - offset)
      } else {
        a.x += a.dx
        a.y += a.dy
        a.x = ((a.x % 1) + 1) % 1
        a.y = ((a.y % 1) + 1) % 1
      }
    }
  }
})

class Particle {
  constructor(p, x, y, color) {
    this.id = Math.random()

    this.p = p
    this.x = x
    this.y = y
    this.dx = 0
    this.dy = 0
    this.color = color
    // TODO: Use mass in an interesting way to scale size and force
    // this.mass = this.p.random(0.5, 3)
  }

  draw() {
    this.p.fill(`hsl(${Math.round(this.color * (360 / cfg.numColors))}, 100%, 50%)`)

    // this.p.fill(`hsl(${360 * (this.color / cfg.numColors)}, 100%, 50%)`)
    this.p.circle(this.x * this.p.width, this.y * this.p.height, 6)
  }
}
