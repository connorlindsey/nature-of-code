import GUI from "lil-gui"
import p5 from "p5"

const gui = new GUI()
const debug = {
  ["5.1"]: { method: "Seek", approach: "Cautious" },
}

gui.addFolder("5.1")
gui.add(debug["5.1"], "method", ["Seek", "Flee", "Wander"])
gui.add(debug["5.1"], "approach", ["Full speed", "Cautious"])

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
