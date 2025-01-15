import GUI from "lil-gui"
import p5 from "p5"

const gui = new GUI()
const debug = {
  walkMethod: "Perlin Noise",
}

/**
 * Random Audio Walker
 *
 * Ideas to extend:
 * - Random walk within a scale or 'real' notes
 * - Multiple instruments with different parameters for bass, melody, etc.
 * - Customize oscillator further for more interesting sounds
 * - Experiment with effects or additional modulation (DelayNode)
 * - Randomize the overall note frequency (top level setInterval duration)
 */
const audioGui = gui.addFolder("Random Audio Walker")

debug.audioWalker = {
  audioState: "playing",
  walkSpeed: 10,
  minFreq: 300,
  maxFreq: 1000,
  durationMean: 450,
  durationSpread: 80,
  shiftChance: 0.1,
  shiftAmount: 50,
}

audioGui.add(debug.audioWalker, "walkSpeed", 0.1, 25).name("Walk Speed")
audioGui.add(debug.audioWalker, "minFreq", 20, 4000).name("Min Frequency (Hz)")
audioGui.add(debug.audioWalker, "maxFreq", 20, 4000).name("Max Frequency (Hz)")
audioGui.add(debug.audioWalker, "durationMean", 100, 500).name("Note Duration (ms)")
audioGui.add(debug.audioWalker, "durationSpread", 0, 200).name("Duration Spread")
audioGui.add(debug.audioWalker, "shiftChance", 0, 1).name("Shift Chance")
audioGui.add(debug.audioWalker, "shiftAmount", 0, 500).name("Shift Amount")

// Visualization
let notes = []

new p5((p) => {
  p.setup = () => {
    // Set up p5 canvas
    const canvas = p.createCanvas(640, 400)
    canvas.parent("audio-walker")

    // Set up audio context and node graph
    // Osc -> Gain -> Pan -> Output
    const audioCtx = new AudioContext()

    const pannerOptions = { pan: 0 }
    const pannerNode = new StereoPannerNode(audioCtx, pannerOptions)

    pannerNode.connect(audioCtx.destination)

    const gainNode = audioCtx.createGain()
    gainNode.connect(pannerNode)

    let shift = 0

    // Debug
    audioGui
      .add(
        {
          toggleState: () => {
            debug.audioWalker.audioState = debug.audioWalker.audioState === "playing" ? "paused" : "playing"
          },
        },
        "toggleState",
      )
      .name("Play/Pause")

    setInterval(() => {
      if (debug.audioWalker.audioState === "playing") {
        const oscillator = audioCtx.createOscillator()
        oscillator.connect(gainNode)
        oscillator.start()

        // Reset gain to 1 (full volume) before starting the oscillator
        gainNode.gain.setValueAtTime(1, audioCtx.currentTime)

        // Chance to jump notes
        const roll = p.random(1)
        if (roll < debug.audioWalker.shiftChance) {
          console.log("Shift")
          shift += debug.audioWalker.shiftAmount
        }

        const randomFreq = p.map(
          p.noise(audioCtx.currentTime / debug.audioWalker.walkSpeed + shift),
          0,
          1,
          debug.audioWalker.minFreq,
          debug.audioWalker.maxFreq,
        )
        oscillator.frequency.value = randomFreq

        // Adjust duration to affect how stoccato/legato the notes are
        const duration = Math.max(
          Math.min(p.randomGaussian(debug.audioWalker.durationMean, debug.audioWalker.durationSpread), 500),
          0,
        )

        // Randomly pan the audio
        const randomPan = p.map(
          p.noise(audioCtx.currentTime / debug.audioWalker.walkSpeed + shift + 100),
          0,
          1,
          -1,
          1,
        )
        pannerNode.pan.setValueAtTime(randomPan, audioCtx.currentTime)

        // Fade out before stopping
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000)

        notes.push(new NoteViz(randomFreq, randomPan, duration))

        setTimeout(() => {
          oscillator.stop()
          oscillator.disconnect()
        }, duration)
      }
    }, 600)
  }

  p.draw = () => {
    p.background(255)

    // Draw notes
    notes.forEach((note) => note.draw(p))
    notes = notes.filter((note) => !note.isFinished())
  }

  class NoteViz {
    constructor(freq, pan, duration) {
      this.freq = freq
      this.pan = pan
      // Keep visualization longer than audio
      this.duration = duration * 3
      this.start = performance.now()

      // Calculate x coords based on freq
      // Currently based on 'absolute' frequency so that the notes are in the same place
      // even as the min/max freq changes.
      this.x = p.map(freq, 0, 4000, 0, p.width)
    }

    draw(p) {
      const b = p.map(this.pan, -1, 0, 0, 255)
      const g = p.map(this.pan, 0, 1, 255, 0)
      const alpha = p.map(this.start, performance.now() - this.duration, performance.now(), 0, 255)

      p.noStroke()
      p.fill(0, g, b, alpha)
      p.circle(this.x, p.height / 2 - 20, 40)
    }

    isFinished() {
      return performance.now() - this.start > this.duration
    }
  }
})

const rndDbg = gui.addFolder("Misc")

// 00 - Random Walker
new p5((p) => {
  let walker

  p.setup = () => {
    const canvas = p.createCanvas(640, 400)
    canvas.parent("00")
    walker = new Walker()

    rndDbg.add(debug, "walkMethod", [
      "Random",
      "Biased Random",
      "Roll",
      "Towards Mouse",
      "Gaussian Steps",
      "Custom Probability",
      "Perlin Noise",
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
      } else if (debug.walkMethod === "Perlin Noise") {
        this.x = p.map(p.noise(this.tx), 0, 1, 0, p.width)
        this.y = p.map(p.noise(this.ty), 0, 1, 0, p.height)

        this.tx += 0.005
        this.ty += 0.005
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
      this.tx = 0
      this.ty = 500
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
