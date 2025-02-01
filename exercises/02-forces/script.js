import GUI from "lil-gui"
import p5 from "p5"

const gui = new GUI()
const debug = {
  windMethod: "Perlin",
}
gui.add(debug, "windMethod", ["Perlin", "Mouse"])

// 00 - Wind & Balloon
new p5((p) => {
  let balloon

  p.setup = () => {
    const canvas = p.createCanvas(640, 400)
    canvas.parent("00")

    balloon = new Balloon(p)
  }

  p.draw = () => {
    p.background(255)

    if (debug.windMethod == "Perlin") {
      let wind = p.createVector(p.noise(p.frameCount * 0.01), 0)
      wind.mult(0.01)
      balloon.applyForce(wind)
    } else if (debug.windMethod == "Mouse") {
      if (p.mouseIsPressed) {
        let wind = p.createVector(p.mouseX - p.width / 2, p.mouseY - p.height / 2)
        wind.normalize()
        let distance = p.dist(p.mouseX, p.mouseY, balloon.position.x, balloon.position.y)
        let strength = p.map(distance, 0, p.width, -0.2, 0)
        wind.mult(strength)
        balloon.applyForce(wind)
      }
    }

    balloon.update()
    balloon.draw()
  }

  p.keyReleased = () => {
    if (p.key == "Backspace") {
      p.clear()
      balloon = new Balloon(p)
    }
  }

  class Balloon {
    constructor(p) {
      this.p = p

      this.r = 48

      this.position = p.createVector(320, 200)
      this.acceleration = p.createVector(0, 0)
      this.velocity = p.createVector(0, 0)
      this.damping = 0.9
    }

    update() {
      // Bouyancy from helium (disable at ~ceiling)
      if (this.position.y - this.r / 2 > 4) {
        this.applyForce(p.createVector(0, -0.05))
      }

      // Drag dampens all acceleration
      let drag = this.velocity.copy()
      drag.mult(-0.01)
      this.applyForce(drag)

      this.velocity.add(this.acceleration)
      this.position.add(this.velocity)
      this.acceleration.mult(0)

      this.checkEdges()
    }

    applyForce(force) {
      this.acceleration.add(force)
    }

    draw() {
      this.p.fill("pink")
      this.p.circle(this.position.x, this.position.y, this.r)
    }

    checkEdges() {
      if (this.position.x + this.r / 2 > this.p.width || this.position.x - this.r / 2 < 0) {
        this.velocity.x *= -this.damping
      }
      if (this.position.y + this.r / 2 > this.p.height || this.position.y - this.r / 2 < 0) {
        this.velocity.y *= -this.damping
      }
      this.position.x = p.constrain(this.position.x, this.r / 2, this.p.width - this.r / 2)
      this.position.y = p.constrain(this.position.y, this.r / 2, this.p.height - this.r / 2)
    }
  }
})
