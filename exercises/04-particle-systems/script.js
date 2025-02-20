import GUI from "lil-gui"
import p5 from "p5"

class Particle {
  constructor(p, x, y, { lifespan = 255 } = {}) {
    this.p = p

    this.position = p.createVector(x, y)
    this.velocity = p.createVector(p.random(-1, 1), p.random(-2, 0))
    this.acceleration = p.createVector(0, 0)

    this.angle = p.random(-2, 2)
    this.angularVelocity = p.random(-1, 1)
    this.angularAcceleration = 0

    this.lifespan = lifespan
  }

  update() {
    this.velocity.add(this.acceleration)
    this.position.add(this.velocity)
    this.acceleration.mult(0)

    this.angularVelocity += this.angularAcceleration
    this.angularVelocity = this.p.constrain(this.angularVelocity, -0.5, 0.5)
    this.angle += this.angularVelocity
    this.angularAcceleration = 0

    this.lifespan -= 2.0
  }

  draw() {
    this.p.stroke(0, this.lifespan)

    this.p.rectMode(this.p.CENTER)

    this.p.push()
    this.p.translate(this.position.x, this.position.y)
    this.p.rotate(this.angle)
    this.p.circle(0, 0, 32)
    this.p.line(0, 0, 16, 0)
    this.p.pop()
  }

  applyForce(force) {
    this.acceleration.add(force)
  }

  applyTorque(amt) {
    this.angularAcceleration += amt
  }

  isDead() {
    return this.lifespan < 0
  }
}

class ParticleSystem {
  constructor(p, amount = 10) {
    this.p = p

    this.particles = []

    for (let i = 0; i < amount; i++) {
      this.particles.push(
        new Particle(p, p.random(0, p.width), p.random(0, 20), {
          lifespan: p.random(100, 500),
        }),
      )
    }
  }

  run() {
    let gravity = this.p.createVector(0, 0.1)

    for (const particle of this.particles) {
      particle.applyForce(gravity)

      particle.applyTorque(0.01)

      particle.update()
      particle.draw()
    }

    // Replace dead particles
    this.particles = this.particles.map((particle) => {
      if (particle.isDead()) {
        particle = new Particle(this.p, this.p.width / 2, 20)
      }
      return particle
    })
  }
}

// 4.3
new p5((p) => {
  let system
  p.setup = () => {
    const canvas = p.createCanvas(640, 240)
    canvas.parent("4.3")

    system = new ParticleSystem(p)
  }

  p.draw = () => {
    p.background(255)

    system.run()
  }
})

// 4.1/2
new p5((p) => {
  let particle
  p.setup = () => {
    const canvas = p.createCanvas(640, 240)
    canvas.parent("4.1")

    particle = new Particle(p, p.width / 2, 20)
  }

  p.draw = () => {
    p.background(255)

    particle.update()
    particle.draw()

    let gravity = p.createVector(0, 0.1)
    particle.applyForce(gravity)

    particle.applyTorque(0.01)

    if (particle.isDead()) {
      particle = new Particle(p, p.width / 2, 20)
    }
  }
})
