import GUI from "lil-gui"
import p5 from "p5"

// Particle Life

// TODO: Only 1 color and hard-coded attraction values to start testing

const gui = new GUI()
let debug = {
  particleCount: 100,
  particleSize: 8,
  colors: ["red", "blue"],
  attractions: [
    [1, -1],
    [1, 1],
  ],
  damping: 0.8,
  beta: 0.3,
  rMax: 100,
}

// TODO: Add presets or ability to randomize

new p5((p) => {
  let particles = []

  gui.add(debug, "particleCount", 1, 1000, 1).onChange(initParticles)
  // TODO: Play around with the attraction values
  // debug.attractions = debug.colors.map(() => debug.colors.map(() => Math.random() * 2 - 0.5))

  function initParticles() {
    console.table(debug.attractions)
    particles = []

    for (let i = 0; i < debug.particleCount; i++) {
      particles.push(
        new Particle(
          p,
          Math.random() * p.width,
          Math.random() * p.height,
          debug.colors[i % debug.colors.length],
        ),
      )
    }
  }

  p.setup = () => {
    p.createCanvas(window.innerWidth, window.innerHeight)
    initParticles()
  }

  p.windowResized = () => {
    p.resizeCanvas(window.innerWidth, window.innerHeight)
  }

  p.draw = () => {
    p.background(10)

    for (let particle of particles) {
      particle.update(particles)
      particle.draw()
    }
  }
})

class Particle {
  constructor(p, x, y, color) {
    this.p = p
    this.pos = this.p.createVector(x, y)
    this.vel = this.p.createVector(0, 0)
    this.color = color
  }

  update(particles) {
    let force = this.p.createVector(0, 0)

    for (let other of particles) {
      // TODO: Improve to only look at nearby particles
      if (other === this) continue

      let dir = this.p.createVector(other.pos.x, other.pos.y).sub(this.pos)
      let dist = dir.mag()

      /**
       * getForce(distance / rMax, attraction) * rMax
       * getForce(distance, attraction) {
       * b = 0.3
       * if (distance < b) {
       *  return distance / b - 1
       * } else if (b < distance && distance < 1) {
       *  return attraction * (1 - Math.abs(2 * distance - 1 - beta) / (1 - beta))
       * } else {
       *  return 0
       * }
       */

      if (dist < 20) {
        force.add(dir.setMag(-2))
      } else if (dist < 250) {
        // TODO: Get the attraction value from the debug.attractions array
        let thisColorIndex = debug.colors.indexOf(this.color)
        let otherColorIndex = debug.colors.indexOf(other.color)
        force.add(dir.setMag(debug.attractions[thisColorIndex][otherColorIndex]))
      }

      // const maxRadius = 100
      // const minRadius = 1
      // if (dist > maxRadius) {
      //   force.add(dir.setMag(1))
      // } else if (dist < minRadius) {
      //   force.add(dir.setMag(1 / dist))
      // } else {
      //   force.add(dir.setMag(1 / dist))
      // }

      // let thisColorIndex = debug.colors.indexOf(this.color)
      // let otherColorIndex = debug.colors.indexOf(other.color)
      // force.mult(debug.attractions[thisColorIndex][otherColorIndex] * 10)

      // TODO: Map around edges
    }

    console.log({ force })

    // Apply friction
    force.mult(debug.damping)

    this.vel.add(force)
    this.pos.add(this.vel)
  }

  draw() {
    this.p.fill(this.color)
    this.p.circle(this.pos.x, this.pos.y, debug.particleSize)
  }
}
