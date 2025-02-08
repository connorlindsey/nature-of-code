import GUI from "lil-gui"
import p5 from "p5"

const gui = new GUI()
const debug = {}

// 3.1
new p5((p) => {
  let angle = 0
  let angularVelocity = 0
  let angularAcceleration = 0.001

  p.setup = () => {
    const canvas = p.createCanvas(640, 300)
    canvas.parent("3.1")
  }

  p.draw = () => {
    p.background(255)
    p.fill(180)
    p.stroke(0)

    p.rectMode(p.CENTER)
    p.translate(p.width / 2, p.height / 2)
    p.rotate(angle)

    p.line(0, 0 - 50, 0, 0 + 50)
    p.circle(0, 0 - 50, 24)
    p.circle(0, 0 + 50, 24)

    if (p.mouseIsPressed) {
      angularVelocity += angularAcceleration
    }

    angle += angularVelocity

    // Drag
    angularVelocity *= 0.99
  }
})

// 3.6
class Ship {
  constructor(p) {
    this.p = p

    this.position = p.createVector(320, 200)
    this.velocity = p.createVector()
    this.acceleration = p.createVector()

    this.heading = 0

    this.damping = 0.995
    this.maxSpeed = 8

    this.size = 12
    this.mass = 3

    this.thrusting = false
  }

  update() {
    // Check inputs
    if (this.p.keyIsDown(65)) {
      this.turn(-0.03)
    } else if (this.p.keyIsDown(68)) {
      this.turn(0.03)
    }

    if (this.p.keyIsDown(87)) {
      this.thrust(0.15)
    } else if (this.p.keyIsDown(83)) {
      this.thrust(-0.1)
    }

    // Update motion
    this.velocity.add(this.acceleration)
    this.velocity.mult(this.damping)
    if (p5.Vector.mag(this.velocity) < 0.025) {
      this.velocity = this.velocity.mult(0)
    }
    this.velocity.limit(this.maxSpeed)
    this.position.add(this.velocity)
    this.acceleration.mult(0)

    // Check edges
    this.checkEdges()

    // Draw
    this.draw()
  }

  applyForce(force) {
    let f = force.copy()
    f.div(this.mass)
    this.acceleration.add(f)
  }

  turn(angle) {
    this.heading += angle
  }

  thrust(amt) {
    let angle = this.heading - this.p.HALF_PI
    let force = p5.Vector.fromAngle(angle)
    force.mult(amt)
    this.applyForce(force)
    this.thrusting = true
  }

  checkEdges() {
    let offset = this.size * 2

    if (this.position.x > this.p.width + offset) {
      this.position.x = -offset
    } else if (this.position.x < -offset) {
      this.position.x = this.p.width + offset
    }

    if (this.position.y > this.p.height + offset) {
      this.position.y = -offset
    } else if (this.position.y < -offset) {
      this.position.y = this.p.height + offset
    }
  }

  draw() {
    this.p.stroke(0)
    this.p.strokeWeight(2)

    this.p.push()

    this.p.translate(this.position.x, this.position.y + this.size)
    this.p.rotate(this.heading)
    if (this.thrusting) {
      this.p.fill(255, 0, 0)
    } else {
      this.p.fill(175)
    }

    // Booster rockets
    this.p.rectMode(this.p.CENTER)
    this.p.rect(-this.size / 2, this.size, this.size / 3, this.size / 2)
    this.p.rect(this.size / 2, this.size, this.size / 3, this.size / 2)
    this.p.fill(175)

    // A triangle
    this.p.beginShape()
    this.p.vertex(-this.size, this.size)
    this.p.vertex(0, -this.size)
    this.p.vertex(this.size, this.size)
    this.p.endShape(this.p.CLOSE)
    this.p.rectMode(this.p.CENTER)
    this.p.pop()

    this.thrusting = false
  }
}

new p5((p) => {
  let ship = new Ship(p)

  p.setup = () => {
    const canvas = p.createCanvas(640, 400)
    canvas.parent("3.6")
  }

  p.draw = () => {
    p.background(255)

    ship.update()
  }
})

// 3.5
new p5((p) => {
  p.setup = () => {
    const canvas = p.createCanvas(640, 180)
    canvas.parent("3.5")
  }

  p.draw = () => {
    p.background(255)

    let period = 120
    let amplitude = 200

    // Calculating horizontal position according to formula for simple harmonic motion
    let x = amplitude * p.sin((p.TWO_PI * p.frameCount) / period)
    let fill = p.map(x, -200, 200, 0, 255)

    p.stroke(0)
    p.strokeWeight(2)
    p.fill(fill)
    p.translate(p.width / 2, p.height / 2)
    p.line(0, 0, x, 0)
    p.circle(x, 0, 48)
  }
})

// 3.9
const waveDebug = gui.addFolder("Wave (3.9)")
debug.waveDebug = {
  method: "sin",
}

waveDebug.add(debug.waveDebug, "method", ["sin", "noise"])

new p5((p) => {
  let startAngle = 0
  let angularVelocity = 0.2

  p.setup = () => {
    const canvas = p.createCanvas(640, 240)
    canvas.parent("3.9")
  }

  p.draw = () => {
    p.background(255)

    let angle = startAngle
    startAngle += 0.02

    for (let x = 0; x <= p.width; x += 24) {
      let y, fill

      if (debug.waveDebug.method === "sin") {
        y = p.map(p.sin(angle), -1, 1, 0, p.height)
        fill = p.map(p.sin(angle), -1, 1, 0, 255)
      } else if (debug.waveDebug.method === "noise") {
        y = p.map(p.noise(angle), -1, 1, 0, p.height)
        fill = p.map(p.noise(angle), -1, 1, 0, 255)
      }

      p.stroke(0)
      p.strokeWeight(2)
      p.fill(fill / 4, fill, 255 - fill)
      p.circle(x, y, 48)

      angle += angularVelocity
    }
  }
})

// 3.10
const springDebug = gui.addFolder("Spring (3.10)")
debug.springDebug = {
  k: 0.2,
  minLen: 30,
  maxLen: 200,
  gravity: 2,
  damping: 0.98,
}
springDebug.add(debug.springDebug, "k", 0, 1, 0.01)
springDebug.add(debug.springDebug, "minLen", 1, 50)
springDebug.add(debug.springDebug, "maxLen", 100, 250)
springDebug.add(debug.springDebug, "gravity", 0, 10, 0.1)
springDebug.add(debug.springDebug, "damping", 0.9, 0.99, 0.001)

class Bob {
  constructor(p, x, y) {
    this.p = p

    this.position = p.createVector(x, y)
    this.velocity = p.createVector()
    this.acceleration = p.createVector()

    this.mass = 24

    this.dragOffset = p.createVector()
    this.dragging = false
  }

  update() {
    this.velocity.add(this.acceleration)
    this.velocity.mult(debug.springDebug.damping)
    this.position.add(this.velocity)
    this.acceleration.mult(0)
  }

  applyForce(force) {
    let f = force.copy()
    f.div(this.mass)
    this.acceleration.add(f)
  }

  draw() {
    this.p.stroke(0)
    this.p.strokeWeight(2)
    if (this.dragging) {
      this.p.fill(180)
    } else {
      this.p.fill(135)
    }
    this.p.circle(this.position.x, this.position.y, this.mass * 2)
  }

  handleClick(mx, my) {
    let d = this.p.dist(mx, my, this.position.x, this.position.y)
    if (d < this.mass) {
      this.dragging = true
      this.dragOffset = this.p.createVector(this.position.x - mx, this.position.y - my)
    }
  }

  handleDrag(mx, my) {
    if (this.dragging) {
      this.position.x = mx + this.dragOffset.x
      this.position.y = my + this.dragOffset.y
    }
  }

  stopDragging() {
    this.dragging = false
  }
}

class Spring {
  constructor(p, x, y, length) {
    this.p = p

    this.anchor = p.createVector(x, y)
    this.restLength = length
  }

  connect(bob) {
    let force = p5.Vector.sub(bob.position, this.anchor)
    let currentLength = force.mag()
    let d = currentLength - this.restLength
    force.setMag(-1 * debug.springDebug.k * d)
    bob.applyForce(force)
  }

  constrainLength(bob, minLen, maxLen) {
    let dir = p5.Vector.sub(bob.position, this.anchor)
    let len = dir.mag()

    if (len < minLen) {
      dir.setMag(minLen)
      bob.position = p5.Vector.add(this.anchor, dir)
      bob.velocity.mult(0)
    } else if (len > maxLen) {
      dir.setMag(maxLen)
      bob.position = p5.Vector.add(this.anchor, dir)
      bob.velocity.mult(0)
    }
  }

  draw() {
    this.p.fill(130)
    this.p.circle(this.anchor.x, this.anchor.y, 10)
  }

  drawLine(bob) {
    this.p.stroke(0)
    this.p.line(bob.position.x, bob.position.y, this.anchor.x, this.anchor.y)
  }
}

new p5((p) => {
  let bob
  let spring

  p.setup = () => {
    const canvas = p.createCanvas(640, 350)
    canvas.parent("3.10")

    spring = new Spring(p, p.width / 2, 10, 110)
    bob = new Bob(p, p.width / 2, 100)
  }

  p.draw = () => {
    p.background(255)

    // Gravity
    bob.applyForce(p.createVector(0, debug.springDebug.gravity))

    // Update bob
    bob.update()
    bob.handleDrag(p.mouseX, p.mouseY)

    // Apply spring to bob
    spring.connect(bob)
    spring.constrainLength(bob, debug.springDebug.minLen, debug.springDebug.maxLen)

    // Draw
    spring.drawLine(bob)
    bob.draw()
    spring.draw()
  }

  p.mousePressed = () => {
    bob.handleClick(p.mouseX, p.mouseY)
  }

  p.mouseReleased = () => {
    bob.stopDragging()
  }
})
