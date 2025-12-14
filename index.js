const canvas = document.querySelector('canvas')
const ctx = canvas.getContext('2d')

const $sprite = document.querySelector('#sprite')

const CONSTANTS = {
  PADDLE_WIDTH: 91,
  PADDLE_HEIGHT: 31,
  PADDLE_SPEED: 10,
  BALL_RADIUS: 3,
  BALL_SPEED: 3,
  BRICK_ROWS: 9,
  BRICK_COLS: 13,
  BRICK_WIDTH: 54,
  BRICK_HEIGHT: 22,
  BRICK_GAP: 0,
  BRICK_OFFSET_TOP: 40,
  BRICK_OFFSET_LEFT: 4,
  COLORS: {
    CYAN: '#00FFFF',
    MAGENTA: '#FF00FF',
    YELLOW: '#FFFF00',
    VIOLET: '#9D00FF',
    GREEN: '#00FF00',
    RED: '#FF0000',
    WHITE: '#FFFFFF'
  },
  STATE: {
    ACTIVE: 1,
    DESTROYED: 0
  }
}

class Ball {
  constructor(x, y, radius, speed) {
    this.x = x
    this.y = y
    this.radius = radius
    this.speed = speed
    this.dx = -speed
    this.dy = -speed
  }

  draw() {
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
    ctx.fillStyle = CONSTANTS.COLORS.WHITE
    ctx.fill()
    ctx.closePath()
  }

  move() {
    this.x += this.dx
    this.y += this.dy
  }

  reset(width, height) {
    this.x = width / 2
    this.y = height - 70
    this.dx = -this.speed
    this.dy = -this.speed
  }
}

class Paddle {
  constructor(canvasWidth, canvasHeight, speed) {
    this.width = CONSTANTS.PADDLE_WIDTH
    this.height = CONSTANTS.PADDLE_HEIGHT
    this.speed = speed
    this.x = (canvasWidth - this.width) / 2
    this.y = canvasHeight - this.height - 10
    this.movingRight = false
    this.movingLeft = false
  }

  draw() {
    ctx.fillStyle = CONSTANTS.COLORS.CYAN
    ctx.fillRect(this.x, this.y, this.width, this.height)

    // Neon glow effect (simplified)
    ctx.shadowBlur = 10
    ctx.shadowColor = CONSTANTS.COLORS.CYAN
    ctx.fillRect(this.x, this.y, this.width, this.height)
    ctx.shadowBlur = 0
  }

  move(canvasWidth) {
    if (this.movingRight && this.x < canvasWidth - this.width) {
      this.x += this.speed
    } else if (this.movingLeft && this.x > 0) {
      this.x -= this.speed
    }
  }

  reset(canvasWidth, canvasHeight) {
    this.x = (canvasWidth - this.width) / 2
    this.y = canvasHeight - this.height - 10
  }
}

class Brick {
  constructor(x, y, color) {
    this.x = x
    this.y = y
    this.status = CONSTANTS.STATE.ACTIVE
    this.color = color
  }

  draw() {
    if (this.status === CONSTANTS.STATE.DESTROYED) return

    let colorHex = CONSTANTS.COLORS.CYAN
    switch (this.color) {
      case 1: colorHex = CONSTANTS.COLORS.CYAN; break
      case 2: colorHex = CONSTANTS.COLORS.MAGENTA; break
      case 3: colorHex = CONSTANTS.COLORS.YELLOW; break
      case 4: colorHex = CONSTANTS.COLORS.VIOLET; break
      case 5: colorHex = CONSTANTS.COLORS.GREEN; break
      case 6: colorHex = CONSTANTS.COLORS.RED; break
      default: colorHex = CONSTANTS.COLORS.CYAN
    }

    ctx.fillStyle = colorHex
    ctx.shadowBlur = 5
    ctx.shadowColor = colorHex
    ctx.fillRect(
      this.x,
      this.y,
      CONSTANTS.BRICK_WIDTH - 2,
      CONSTANTS.BRICK_HEIGHT - 2
    )
    ctx.shadowBlur = 0
  }
}

class Game {
  constructor() {
    this.lives = 3
    this.score = 0
    this.highScore = parseInt(localStorage.getItem('breakout_highscore')) || 0
    this.level = 1
    this.active = false
    this.bricks = []

    // Set canvas size
    this.resizeCanvas()
    window.addEventListener('resize', () => this.resizeCanvas())

    // Game Objects
    this.ball = new Ball(canvas.width / 2, canvas.height - 70, CONSTANTS.BALL_RADIUS, CONSTANTS.BALL_SPEED)
    this.paddle = new Paddle(canvas.width, canvas.height, CONSTANTS.PADDLE_SPEED)

    // FPS control
    this.fps = 60
    this.msPerFrame = 1000 / this.fps
    this.msPrev = window.performance.now()
    this.frames = 0
    this.framesPerSec = this.fps
    this.msFPSPrev = window.performance.now() + 1000

    this.initEvents()
  }

  resizeCanvas() {
    canvas.width = 710 // Maintain fixed width for logic consistency as per original design, or make it dynamic if desired. 
    // Wait, original had fixed width 710 but dynamic height.
    // If I want it fully responsive I should calculate width relative to window but that breaks the grid logic unless I scale everything.
    // I will stick to the original width logic but ensure it centers (handled by CSS) and keep height dynamic.

    // Better yet, let's just update height as original did, but I'll add logic to ensure paddle stays in bounds.
    canvas.width = 710
    canvas.height = window.innerHeight - 30

    if (this.paddle) {
      // Reposition paddle Y
      this.paddle.y = canvas.height - this.paddle.height - 10
      // Check X bounds
      if (this.paddle.x + this.paddle.width > canvas.width) {
        this.paddle.x = canvas.width - this.paddle.width
      }
    }

    if (!this.active && this.ball) {
      // Reset ball Y
      this.ball.y = canvas.height - 70
    }
  }

  initLevel(levelId) {
    this.level = levelId
    this.bricks = []
    for (let c = 0; c < CONSTANTS.BRICK_COLS; c++) {
      this.bricks[c] = []
      for (let r = 0; r < CONSTANTS.BRICK_ROWS; r++) {
        const brickX = c * (CONSTANTS.BRICK_WIDTH + CONSTANTS.BRICK_GAP) + CONSTANTS.BRICK_OFFSET_LEFT
        const brickY = r * (CONSTANTS.BRICK_HEIGHT + CONSTANTS.BRICK_GAP) + CONSTANTS.BRICK_OFFSET_TOP
        const color = this.getBrickColor(r, c)
        this.bricks[c][r] = new Brick(brickX, brickY, color)
      }
    }
  }

  getBrickColor(r, c) {
    let color = 1
    const level = String(this.level)

    if (level === '1') {
      if (r === 0 || r === 8 || c === 6) color = 2
      if (
        (r === 1 && c < 4 && c > 2) ||
        (r === 2 && c < 4 && c > 1) ||
        (r === 3 && c < 6 && c > 0) ||
        (r === 4 && c < 6) ||
        (r === 5 && c < 6 && c > 0) ||
        (r === 6 && c < 4 && c > 1) ||
        (r === 7 && c < 4 && c > 2)
      ) color = 3

      if (
        (r === 1 && c > 8 && c < 10) ||
        (r === 2 && c > 8 && c < 11) ||
        (r === 3 && c > 6 && c < 12) ||
        (r === 4 && c > 6) ||
        (r === 5 && c > 6 && c < 12) ||
        (r === 6 && c > 8 && c < 11) ||
        (r === 7 && c > 8 && c < 10)
      ) color = 4
    } else if (level === '2') {
      if (
        ((c === 1 || c === 11) && r < 6) ||
        (c === 6 && r > 2) ||
        (c === 7 && r === 3) ||
        (c === 8 && r === 2) ||
        (c === 9 && r === 1) ||
        (c === 10 && r === 0) ||
        (c === 7 && r === 8) ||
        (c === 8 && r === 7) ||
        (c === 9 && r === 6) ||
        (c === 10 && r === 5) ||
        (c === 5 && r === 3) ||
        (c === 4 && r === 2) ||
        (c === 3 && r === 1) ||
        (c === 2 && r === 0) ||
        (c === 5 && r === 8) ||
        (c === 4 && r === 7) ||
        (c === 3 && r === 6) ||
        (c === 2 && r === 5)
      ) color = 3
      if (
        (c === 10 && r > 0 && r < 5) ||
        (c === 9 && r > 1 && r < 6) ||
        (c === 8 && r > 2 && r < 7) ||
        (c === 7 && r > 3 && r < 8)
      ) color = 4
      if (
        (c === 2 && r > 0 && r < 5) ||
        (c === 3 && r > 1 && r < 6) ||
        (c === 4 && r > 2 && r < 7) ||
        (c === 5 && r > 3 && r < 8)
      ) color = 5
    } else if (level === '3') {
      if (
        c === 6 ||
        (r === 0 && (c < 2 || c > 10)) ||
        (r === 8 && c > 3 && c < 9)
      ) color = 2
      if (
        (r === 2 && (c < 2 || c > 10)) ||
        (r === 1 && ((c > 1 && c < 4) || (c > 8 && c < 11))) ||
        (r === 0 && ((c > 3 && c < 6) || (c > 6 && c < 9)))
      ) color = 3
      if (
        (r === 4 && (c < 2 || c > 10)) ||
        (r === 3 && ((c > 1 && c < 4) || (c > 8 && c < 11))) ||
        (r === 2 && ((c > 3 && c < 6) || (c > 6 && c < 9)))
      ) color = 4
      if (
        (r === 6 && (c < 2 || c > 10)) ||
        (r === 5 && ((c > 1 && c < 4) || (c > 8 && c < 11))) ||
        (r === 4 && ((c > 3 && c < 6) || (c > 6 && c < 9)))
      ) color = 5
      if (
        (r === 8 && (c < 2 || c > 10)) ||
        (r === 7 && ((c > 1 && c < 4) || (c > 8 && c < 11))) ||
        (r === 6 && ((c > 3 && c < 6) || (c > 6 && c < 9)))
      ) color = 6
    }

    return color
  }

  start() {
    this.active = true
    this.score = 0
    this.lives = 3

    // Get values from UI
    const radioVal = document.getElementById('radioPelota').valueAsNumber
    const velocidadVal = document.getElementById('velocidadRaqueta').valueAsNumber

    this.ball.radius = radioVal
    this.ball.reset(canvas.width, canvas.height)

    this.paddle.speed = velocidadVal
    this.paddle.reset(canvas.width, canvas.height)

    document.getElementById('paginaInicio').classList.add('oculto')

    // Start Loop
    this.loop()
  }

  gameOver() {
    this.active = false
    document.getElementById('paginaInicio').classList.remove('oculto')
    if (this.score > this.highScore) {
      this.highScore = this.score
      localStorage.setItem('breakout_highscore', this.highScore)
    }
  }

  collisionDetection() {
    for (let c = 0; c < CONSTANTS.BRICK_COLS; c++) {
      for (let r = 0; r < CONSTANTS.BRICK_ROWS; r++) {
        const b = this.bricks[c][r]
        if (b.status === CONSTANTS.STATE.DESTROYED) continue

        const isBallSameXAsBrick =
          this.ball.x > b.x &&
          this.ball.x < b.x + CONSTANTS.BRICK_WIDTH

        const isBallSameYAsBrick =
          this.ball.y > b.y &&
          this.ball.y < b.y + CONSTANTS.BRICK_HEIGHT

        if (isBallSameXAsBrick && isBallSameYAsBrick) {
          this.ball.dy = -this.ball.dy
          b.status = CONSTANTS.STATE.DESTROYED
          this.score += 10
        }
      }
    }
  }

  ballMovement() {
    // Wall collisions
    if (
      this.ball.x + this.ball.dx > canvas.width - this.ball.radius ||
      this.ball.x + this.ball.dx < this.ball.radius
    ) {
      this.ball.dx = -this.ball.dx
    }

    // Shield (Top) collision
    if (this.ball.y + this.ball.dy < this.ball.radius) {
      this.ball.dy = -this.ball.dy
    }

    // Paddle collision
    const isBallSameXAsPaddle =
      this.ball.x > this.paddle.x &&
      this.ball.x < this.paddle.x + this.paddle.width

    const isBallTouchingPaddle =
      this.ball.y + this.ball.dy > this.paddle.y

    if (isBallSameXAsPaddle && isBallTouchingPaddle) {
      this.ball.dy = -this.ball.dy
    } else if (
      this.ball.y + this.ball.dy > canvas.height - this.ball.radius ||
      this.ball.y + this.ball.dy > this.paddle.y + this.paddle.height
    ) {
      // Game Over state for life loss
      this.lives--
      if (this.lives === 0) {
        this.gameOver()
      } else {
        this.ball.reset(canvas.width, canvas.height)
        this.paddle.reset(canvas.width, canvas.height)
      }
    }

    this.ball.move()
  }

  drawUI() {
    ctx.font = '10px Verdana'
    ctx.fillStyle = CONSTANTS.COLORS.WHITE

    // FPS
    ctx.fillText(`FPS: ${this.framesPerSec}`, 5, 10)

    // Score
    ctx.font = '20px Verdana'
    ctx.fillText(`Score: ${this.score}`, 5, canvas.height - 20)
    ctx.font = '10px Verdana' // Reset

    // High Score
    ctx.fillText(`High Score: ${this.highScore}`, canvas.width - 150, 10)

    // Lives
    for (let i = 0; i < this.lives; i++) {
      ctx.fillStyle = CONSTANTS.COLORS.MAGENTA
      ctx.beginPath()
      ctx.arc(320 + 40 * i, 15, 10, 0, Math.PI * 2)
      ctx.fill()
      ctx.closePath()
    }
  }

  cleanCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  loop() {
    if (!this.active) return

    window.requestAnimationFrame(() => this.loop())

    const msNow = window.performance.now()
    const msPassed = msNow - this.msPrev

    if (msPassed < this.msPerFrame) return

    const excessTime = msPassed % this.msPerFrame
    this.msPrev = msNow - excessTime

    this.frames++

    if (this.msFPSPrev < msNow) {
      this.msFPSPrev = window.performance.now() + 1000
      this.framesPerSec = this.frames
      this.frames = 0
    }

    this.cleanCanvas()
    this.ball.draw()
    this.paddle.draw()

    for (let c = 0; c < CONSTANTS.BRICK_COLS; c++) {
      for (let r = 0; r < CONSTANTS.BRICK_ROWS; r++) {
        this.bricks[c][r].draw()
      }
    }

    this.drawUI()

    this.collisionDetection()
    this.ballMovement()
    this.paddle.move(canvas.width)
  }

  initEvents() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Right' || e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
        this.paddle.movingRight = true
      } else if (e.key === 'Left' || e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
        this.paddle.movingLeft = true
      }
    })

    document.addEventListener('keyup', (e) => {
      if (e.key === 'Right' || e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
        this.paddle.movingRight = false
      } else if (e.key === 'Left' || e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
        this.paddle.movingLeft = false
      }
    })
  }
}

// Initialize Game
const game = new Game()

// UI Interaction
let botonAnterior = document.getElementsByClassName('active')[0]
const niveles = document.getElementById('niveles')

niveles.addEventListener('click', (e) => {
  const esBoton = e.target.nodeName === 'BUTTON'
  if (!esBoton) return

  e.target.classList.add('active')
  if (botonAnterior !== null && botonAnterior !== e.target) {
    botonAnterior.classList.remove('active')
  }
  botonAnterior = e.target
})

const botonJugar = document.getElementById('botonJugar')
botonJugar.addEventListener('click', () => {
  const nivelElegido = document.getElementsByClassName('active')[0].id
  game.initLevel(nivelElegido)
  game.start()
})

// Dialogs
const botonAyuda = document.getElementById('botonAyuda')
const cerrarAyuda = document.getElementById('cerrarAyuda')
const dialogAyuda = document.getElementById('dialogAyuda')

botonAyuda.addEventListener('click', () => dialogAyuda.showModal())
cerrarAyuda.addEventListener('click', () => dialogAyuda.close())

const botonAjustes = document.getElementById('botonAjustes')
const cerrarAjustes = document.getElementById('cerrarAjustes')
const dialogAjustes = document.getElementById('dialogAjustes')

botonAjustes.addEventListener('click', () => dialogAjustes.showModal())
cerrarAjustes.addEventListener('click', () => dialogAjustes.close())
