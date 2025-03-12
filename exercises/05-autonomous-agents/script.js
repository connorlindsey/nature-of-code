import GUI from "lil-gui"
import p5 from "p5"

const gui = new GUI()
const debug = {
  ["5.1"]: { method: "Seek", approach: "Cautious" },
  ff: { vehicleCount: 10, drawField: true, fieldStrength: 0.5 },
}

const five1 = gui.addFolder("5.1")
five1.add(debug["5.1"], "method", ["Seek", "Flee", "Wander"])
five1.add(debug["5.1"], "approach", ["Full speed", "Cautious"])

class Vehicle1 {
  constructor(p, x, y, { mass = 15, maxSpeed = 3, maxForce = 0.5 } = {}) {
    this.p = p

    this.position = p.createVector(x, y)
    this.velocity = p.createVector()
    this.acceleration = p.createVector()

    this.mass = mass
    this.maxSpeed = maxSpeed
    this.maxForce = maxForce

    this.r = 6
    this.wandertheta = 0.0
    this.maxspeed = 2
  }

  seek(target) {
    // Calculate the desired velocity
    let desired = p5.Vector.sub(target, this.position)

    // Skip if we're close enough
    if (desired.mag() < 1) {
      this.velocity = this.p.createVector()
      return
    }

    if (debug["5.1"].method === "Flee") {
      desired = p5.Vector.mult(desired, -1)
    }

    // Set magnitude based on approach strategy
    if (debug["5.1"].approach === "Full speed") {
      desired.setMag(this.maxSpeed)
    } else {
      let d = desired.mag()
      if (d < 100) {
        let m = this.p.map(d, 0, 100, 0, this.maxSpeed)
        desired.setMag(m)
      } else {
        desired.setMag(this.maxSpeed)
      }
    }

    // Calculate steering force
    let steer = p5.Vector.sub(desired, this.velocity)
    steer.limit(this.maxForce)
    this.applyForce(steer)
  }

  wander() {
    let wanderR = 25
    let wanderD = 80
    let change = 0.3
    this.wandertheta += this.p.random(-change, change)

    let circlePos = this.velocity.copy()
    circlePos.normalize()
    circlePos.mult(wanderD)
    circlePos.add(this.position)

    let h = this.velocity.heading()

    let circleOffSet = this.p.createVector(
      wanderR * this.p.cos(this.wandertheta + h),
      wanderR * this.p.sin(this.wandertheta + h),
    )
    let target = p5.Vector.add(circlePos, circleOffSet)
    this.seek(target)

    this.drawWanderDebug(this.position, circlePos, target, wanderR)
  }

  applyForce(force) {
    let f = force.copy()
    f.div(this.mass)
    this.acceleration.add(f)
  }

  run() {
    this.update()
    this.draw()
  }

  update() {
    this.velocity.add(this.acceleration)
    this.position.add(this.velocity)

    // Wrap
    if (this.position.x < -this.r) this.position.x = this.p.width + this.r
    if (this.position.y < -this.r) this.position.y = this.p.height + this.r
    if (this.position.x > this.p.width + this.r) this.position.x = -this.r
    if (this.position.y > this.p.height + this.r) this.position.y = -this.r

    this.acceleration.mult(0)
  }

  draw() {
    let angle = this.velocity.heading()

    this.p.rectMode(this.p.CENTER)

    this.p.push()
    this.p.translate(this.position.x, this.position.y)
    this.p.rotate(angle)
    this.p.circle(0, 0, 32)
    this.p.line(0, 0, 16, 0)
    this.p.pop()
  }

  drawWanderDebug(location, circlePos, target, rad) {
    this.p.stroke(0)
    this.p.noFill()
    this.p.strokeWeight(1)
    this.p.circle(circlePos.x, circlePos.y, rad * 2)
    this.p.circle(target.x, target.y, 4)
    this.p.line(location.x, location.y, circlePos.x, circlePos.y)
    this.p.line(circlePos.x, circlePos.y, target.x, target.y)
  }
}

new p5((p) => {
  let vehicle
  p.setup = () => {
    let canvas = p.createCanvas(640, 300)
    canvas.parent("5.1")

    vehicle = new Vehicle1(p, p.width / 2, p.height / 2)
  }

  p.draw = () => {
    p.background(255)

    if (debug["5.1"].method === "Wander") {
      vehicle.wander()
    } else {
      vehicle.seek(p.createVector(p.constrain(p.mouseX, 0, p.width), p.constrain(p.mouseY, 0, p.height)))
    }
    vehicle.run()

    p.circle(p.mouseX, p.mouseY, 8)
  }
})

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//          Flow field
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
const ff = gui.addFolder("Flow field")

class PerlinFlowField {
  constructor(p, r) {
    this.p = p
    this.r = r
    this.cols = Math.floor(p.width / r)
    this.rows = Math.floor(p.height / r)
    this.values = new Array(this.cols)
    for (let i = 0; i < this.cols; i++) {
      this.values[i] = new Array(this.rows)
    }

    this.zoff = 0
    this.update()
  }

  update() {
    let xoff = 0
    for (let i = 0; i < this.cols; i++) {
      let yoff = 0
      for (let j = 0; j < this.rows; j++) {
        let angle = this.p.map(this.p.noise(xoff, yoff, this.zoff), 0, 1, 0, this.p.PI * 4)
        this.values[i][j] = p5.Vector.fromAngle(angle)
        yoff += 0.1
      }
      xoff += 0.1
    }
    this.zoff += 0.01
  }

  draw() {
    for (let i = 0; i < this.cols; i++) {
      for (let j = 0; j < this.rows; j++) {
        let x = i * this.r + this.r / 2
        let y = j * this.r + this.r / 2
        let v = this.values[i][j].copy()
        v.setMag(this.r * 0.5)

        this.p.stroke("rgba(0, 0, 0, 1)")
        this.p.line(x, y, x + v.x, y + v.y)
      }
    }
  }
}

class FlowVehicle {
  constructor(p, x, y) {
    this.p = p

    this.pos = this.p.createVector(x, y)
    this.vel = this.p.createVector()
    this.acc = this.p.createVector()

    this.maxSpeed = 5
    this.r = this.p.random(12, 64)
  }

  update() {
    this.vel.add(this.acc)
    this.vel.limit(this.maxSpeed)
    this.pos.add(this.vel)

    // Wrap
    if (this.pos.x < -this.r) this.pos.x = this.p.width + this.r
    if (this.pos.y < -this.r) this.pos.y = this.p.height + this.r
    if (this.pos.x > this.p.width + this.r) this.pos.x = -this.r
    if (this.pos.y > this.p.height + this.r) this.pos.y = -this.r

    this.acc.mult(0)
  }

  follow(flowField) {
    let x = this.p.constrain(Math.floor(this.pos.x / flowField.r), 0, flowField.cols - 1)
    let y = this.p.constrain(Math.floor(this.pos.y / flowField.r), 0, flowField.rows - 1)
    let value = flowField.values[x][y]
    let followForce = value.mult(debug.ff.fieldStrength)
    this.applyForce(followForce)
  }

  applyForce(force) {
    let f = force.copy()
    f.div(this.r / 16)
    this.acc.add(f)
  }

  draw() {
    let angle = this.vel.heading()

    this.p.rectMode(this.p.CENTER)

    this.p.push()
    this.p.fill("rgba(0, 0, 0, 0.2)")
    this.p.translate(this.pos.x, this.pos.y)
    this.p.rotate(angle)
    this.p.circle(0, 0, this.r)
    this.p.line(0, 0, this.r / 2, 0)
    this.p.pop()
  }
}

let resolution = 16

new p5((p) => {
  let flowField

  let vehicles = []
  const initVehicles = () => {
    vehicles = []
    for (let i = 0; i < debug.ff.vehicleCount; i++) {
      vehicles.push(new FlowVehicle(p, p.random(0, p.width), p.random(0, p.height)))
    }
  }

  ff.add(debug["ff"], "drawField")
  ff.add(debug["ff"], "fieldStrength", 0.1, 1, 0.01)
  ff.add(debug.ff, "vehicleCount", 1, 500, 1).onChange(initVehicles)
  ff.add(
    {
      ["Reset flow field"]: () => {
        p.noiseSeed(p.random(10000))
        flowField = new PerlinFlowField(p, resolution)
      },
    },
    "Reset flow field",
  )

  p.setup = () => {
    let canvas = p.createCanvas(800, 400)
    canvas.parent("flow-field")

    flowField = new PerlinFlowField(p, resolution)
    initVehicles()
  }

  p.draw = () => {
    p.background(255)

    // Update
    flowField.update()
    for (const vehicle of vehicles) {
      vehicle.follow(flowField)
      vehicle.update()
    }

    // Draw
    for (const vehicle of vehicles) {
      vehicle.draw()
    }
    if (debug.ff.drawField) {
      flowField.draw()
    }
  }
})
