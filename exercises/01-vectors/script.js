import p5 from "p5"

// 00 - Bouncing DVD icon
new p5((p) => {
  const radius = 48
  const width = 96
  const height = 48

  let position, velocity
  let dvdIcon

  p.preload = () => {
    dvdIcon = p.loadImage("/DVD_logo.png")
  }

  p.setup = () => {
    const canvas = p.createCanvas(640, 400)
    canvas.parent("00")

    position = p.createVector(320, 200)
    velocity = p.createVector(3.5, 2.5)
  }

  p.draw = () => {
    p.background(255)

    position.add(velocity)

    // DVD Icon
    const xOffset = width / 2
    const yOffset = height / 2
    let flipped = p.createVector(false, false)
    if (position.x + xOffset > p.width || position.x - xOffset < 0) {
      velocity.x *= -1
      flipped.x = true
    }
    if (position.y + yOffset > p.height || position.y - yOffset < 0) {
      velocity.y *= -1
      flipped.y = true
    }
    p.image(dvdIcon, position.x - width / 2, position.y - height / 2, width, height)

    if (flipped.x && flipped.y) {
      alert("Hit the corner!")
    }

    // Ball
    // const offset = radius / 2
    // if (position.x + offset > p.width || position.x - offset < 0) {
    //   velocity.x *= -1
    // }
    // if (position.y + offset > p.height || position.y - offset < 0) {
    //   velocity.y *= -1
    // }

    // p.stroke(0)
    // p.fill(127)
    // p.circle(position.x, position.y, radius)
  }
})
