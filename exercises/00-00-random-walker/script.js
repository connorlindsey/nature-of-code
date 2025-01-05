import GUI from "lil-gui"
import p5 from "p5"

const gui = new GUI()
const debug = {
  walkMethod: "Random",
}

// 00 - Random Walker
new p5((p) => {
  let walker

  p.setup = () => {
    const canvas = p.createCanvas(640, 400)
    canvas.parent("00")
    walker = new Walker()

    gui.add(debug, "walkMethod", [
      "Random",
      "Biased Random",
      "Roll",
      "Towards Mouse",
      "Gaussian Steps",
      "Custom Probability",
    ])
  }

  p.draw = () => {
    walker.step()
    walker.show()
  }

  p.keyReleased = () => {
    if (p.key == "Backspace") {
      p.clear()
      walker.init()
    }
  }

  class Walker {
    constructor() {
      this.init()
    }

    step() {
      if (debug.walkMethod === "Random") {
        // 0. Random movement
        this.x += p.random(-1, 1)
        this.y += p.random(-1, 1)
      } else if (debug.walkMethod === "Biased Random") {
        // 1. Favors down/left movement
        this.x += p.random(-3, 2.75)
        this.y += p.random(-2.75, 3)
      } else if (debug.walkMethod === "Roll") {
        // 2. Tends towards the right based on probabilty / roll
        let r = p.random(1)
        if (r < 0.4) {
          this.x++
        } else if (r < 0.6) {
          this.x--
        } else if (r < 0.8) {
          this.y++
        } else {
          this.y--
        }
      } else if (debug.walkMethod === "Towards Mouse") {
        // 3. Tends to move towards the mouse
        let r = p.random(1)
        if (r < 0.25) {
          this.x += Math.sign(p.mouseX - this.x)
        } else if (r < 0.5) {
          this.y += Math.sign(p.mouseY - this.y)
        } else {
          this.x += p.random(-1, 1)
          this.y += p.random(-1, 1)
        }
      } else if (debug.walkMethod === "Gaussian Steps") {
        // 4. Normally distributed step size
        this.x += p.randomGaussian(0, 3)
        this.y += p.randomGaussian(0, 3)
      } else if (debug.walkMethod === "Custom Probability") {
        // 5. Quadratic random walker
        let step = 2
        let xstep = this.acceptReject() * step
        if (p.random([true, false])) {
          xstep *= -1
        }

        let ystep = this.acceptReject() * step
        if (p.random([true, false])) {
          ystep *= -1
        }
        this.x += xstep
        this.y += ystep
      }
    }

    acceptReject() {
      while (true) {
        let r1 = p.random(1)
        let prob = r1 * r1
        let r2 = p.random(1)

        if (r2 < prob) {
          return r1
        }
      }
    }

    show() {
      p.stroke(0)
      p.point(this.x, this.y)
    }

    init() {
      this.x = p.width / 2
      this.y = p.height / 2
    }
  }
})

// 01 - Random Distribution
new p5((p) => {
  let randomCounts = []
  let total = 20

  p.setup = () => {
    const canvas = p.createCanvas(640, 200)
    canvas.parent("01")

    randomCounts = new Array(total).fill(0)
  }

  p.draw = () => {
    // Pick a random bucket and increase the count
    let idx = p.floor(p.random(randomCounts.length))
    randomCounts[idx]++

    p.stroke(0)
    p.fill(127)

    let w = p.width / randomCounts.length

    // Draw the results
    for (let x = 0; x < randomCounts.length; x++) {
      p.rect(x * w, p.height - randomCounts[x], w - 1, randomCounts[x])
    }
  }

  p.keyReleased = () => {
    if (p.key == "Backspace") {
      p.clear()
      randomCounts = new Array(total).fill(0)
    }
  }
})

// 02 - Paint Splatter
new p5((p) => {
  // TODO: Move to debug panel
  let positionSpread = 25
  let sizeSpread = 5
  let size = 1

  // Color
  let hue = 170
  let hueSpread = 15
  let saturation = 80
  let saturationSpread = 20
  let light = 90
  let lightSpread = 10

  p.setup = () => {
    const canvas = p.createCanvas(640, 400)
    canvas.parent("02")

    p.colorMode(p.HSB)
    p.frameRate(20)
  }

  p.draw = () => {
    // Center
    p.translate(p.width / 2, p.height / 2)

    // Generate position, radius, and HSL with normal distribution
    let x = p.randomGaussian(0, positionSpread)
    let y = p.randomGaussian(0, positionSpread)
    let r = p.randomGaussian(size / p.height, sizeSpread)

    let h = p.randomGaussian(hue, hueSpread) % 360
    let s = p.randomGaussian(saturation, saturationSpread) % 100
    let l = p.randomGaussian(light, lightSpread) % 100

    p.noStroke()

    p.fill(h, s, l, 1.0)
    p.ellipse(x, y, r, r)
  }

  p.keyReleased = () => {
    if (p.key == "Backspace") {
      p.clear()
    }
  }
})
