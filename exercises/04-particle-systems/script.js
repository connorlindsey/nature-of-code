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

class BasicParticle extends Particle {
  constructor(p, x, y, options) {
    super(p, x, y, options)
  }

  draw() {
    this.p.stroke(0, this.lifespan)
    this.p.fill(0, this.lifespan)

    this.p.circle(this.position.x, this.position.y, 16)
  }
}

class Emitter {
  constructor(
    p,
    { amount = 10, maxEmitted = undefined, particleType = Particle, position = undefined } = {},
  ) {
    this.p = p

    this.maxEmitted = maxEmitted
    this.particleType = particleType
    this.position = position ?? p.createVector(p.width / 2, p.random(0, 20))

    this.particles = []

    for (let i = 0; i < amount; i++) {
      this.particles.push(
        new this.particleType(p, this.position.x, this.position.y, {
          lifespan: p.random(100, 400),
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
        particle = new this.particleType(this.p, this.position.x, this.position.y, {
          lifespan: this.p.random(100, 400),
        })

        if (this.maxEmitted !== undefined) {
          this.maxEmitted -= 1
        }
      }
      return particle
    })
  }

  isDead() {
    return this.maxEmitted === undefined ? false : this.maxEmitted <= 0
  }
}

// 4.5
new p5((p) => {
  let emitters = []
  p.setup = () => {
    const canvas = p.createCanvas(640, 240)
    canvas.parent("4.5")
  }

  p.mouseClicked = () => {
    emitters.push(
      new Emitter(p, {
        particleType: BasicParticle,
        position: p.createVector(p.mouseX, p.mouseY),
        maxEmitted: 25,
      }),
    )
  }

  p.draw = () => {
    p.background(255)

    emitters = emitters
      .map((e) => {
        if (e.isDead()) {
          return null
        } else {
          e.run()
          return e
        }
      })
      .filter((e) => !!e)
  }
})

// 4.3
new p5((p) => {
  let system
  p.setup = () => {
    const canvas = p.createCanvas(640, 240)
    canvas.parent("4.3")

    system = new Emitter(p, {
      particleType: BasicParticle,
      position: p.createVector(p.mouseX, p.mouseY),
    })
  }

  p.draw = () => {
    p.background(255)

    system.position = p.createVector(p.mouseX, p.mouseY)

    system.run()
  }
})

// 4.2
new p5((p) => {
  let system
  p.setup = () => {
    const canvas = p.createCanvas(640, 240)
    canvas.parent("4.2")

    system = new Emitter(p)
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
