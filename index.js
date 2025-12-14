const canvas = document.querySelector('canvas')
const ctx = canvas.getContext('2d')

const $sprite = document.querySelector('#sprite')

canvas.width = 710
canvas.height = window.innerHeight - 30 // 590

/* Variables de nuestro juego */
let vidas = 3
let nivelElegido = 1

/* VARIABLES DE LA PELOTA */
let radioPelota = 3
// posicion de la pelota
let x = canvas.width / 2
let y = canvas.height - 70
// velocidad de la pelota
let dx = -3
let dy = -3

const PALETTE = {
  cyan: '#00FFFF',
  magenta: '#FF00FF',
  yellow: '#FFFF00',
  violet: '#9D00FF',
  green: '#00FF00',
  red: '#FF0000',
  white: '#FFFFFF'
}

/* VARIABLES DE LA RAQUETA */
let velocidadRaqueta = 10

const alturaRaqueta = 31
const anchoRaqueta = 91

let raquetaX = (canvas.width - anchoRaqueta) / 2
let raquetaY = canvas.height - alturaRaqueta - 10

let derechoPresionado = false
let izquierdoPresionado = false

/* VARIABLES DE LOS LADRILLOS */
const filasLadrillos = 9
const columnasLadrillos = 13
const anchoLadrillo = 54
const altoLadrillo = 22
const distanciaEntreLadrillos = 0
const distanciaLadrillosTop = 40
const distanciaLadrillosIzq = 4
const ladrillos = []

const ESTADO_LADRILLO = {
  ACTIVO: 1,
  DESTRUIDO: 0
}

let botonAnterior = document.getElementsByClassName('active')[0]
const niveles = document.getElementById('niveles')
niveles.addEventListener('click', (e) => {
  const esBoton = e.target.nodeName === 'BUTTON'

  if (!esBoton) {
    return
  }

  e.target.classList.add('active')

  if (botonAnterior !== null && botonAnterior !== e.target) {
    botonAnterior.classList.remove('active')
  }

  botonAnterior = e.target
})

const botonJugar = document.getElementById('botonJugar')
botonJugar.addEventListener('click', () => {
  document.getElementById('paginaInicio').classList.toggle('oculto')
  nivelElegido = document.getElementsByClassName('active')[0].id
  radioPelota = document.getElementById('radioPelota').valueAsNumber
  velocidadRaqueta = document.getElementById('velocidadRaqueta').valueAsNumber

  for (let c = 0; c < columnasLadrillos; c++) {
    ladrillos[c] = [] // inicializamos con un array vacio
    for (let r = 0; r < filasLadrillos; r++) {
      // calculamos la posicion del ladrillo en la pantalla
      const brickX = c * (anchoLadrillo + distanciaEntreLadrillos) + distanciaLadrillosIzq
      const brickY = r * (altoLadrillo + distanciaEntreLadrillos) + distanciaLadrillosTop
      // Asignar un color a cada ladrillo (depende del nivel en el que estemos)
      const colorNivel = colorLadrillo(r, c)

      // Guardamos la información de cada ladrillo
      ladrillos[c][r] = {
        x: brickX,
        y: brickY,
        status: ESTADO_LADRILLO.ACTIVO,
        color: colorNivel
      }
    }
  }
  draw()
  initEvents()
})

function drawBall() {
  ctx.beginPath() // iniciar el trazado
  ctx.arc(x, y, radioPelota, 0, Math.PI * 2)
  ctx.fillStyle = PALETTE.white
  ctx.fill()
  ctx.closePath() // terminar el trazado
}

function drawraqueta() {
  ctx.fillStyle = PALETTE.cyan
  ctx.fillRect(raquetaX, raquetaY, anchoRaqueta, alturaRaqueta)

  // Neon glow effect (simplified)
  ctx.shadowBlur = 10
  ctx.shadowColor = PALETTE.cyan
  ctx.fillRect(raquetaX, raquetaY, anchoRaqueta, alturaRaqueta)
  ctx.shadowBlur = 0
}

function drawBricks() {
  for (let c = 0; c < columnasLadrillos; c++) {
    for (let r = 0; r < filasLadrillos; r++) {
      const currentBrick = ladrillos[c][r]
      if (currentBrick.status === ESTADO_LADRILLO.DESTRUIDO) continue

      let color = PALETTE.cyan
      switch (currentBrick.color) {
        case 1: color = PALETTE.cyan; break; // Washer - like
        case 2: color = PALETTE.magenta; break;
        case 3: color = PALETTE.yellow; break;
        case 4: color = PALETTE.violet; break;
        case 5: color = PALETTE.green; break;
        case 6: color = PALETTE.red; break;
        default: color = PALETTE.cyan;
      }

      ctx.fillStyle = color
      ctx.shadowBlur = 5
      ctx.shadowColor = color
      ctx.fillRect(
        currentBrick.x,
        currentBrick.y,
        anchoLadrillo - 2, // Slight gap
        altoLadrillo - 2
      )
      ctx.shadowBlur = 0
    }
  }
}

function drawUI() {
  ctx.font = '10px Verdana'
  ctx.fillStyle = PALETTE.white
  ctx.fillText(`FPS: ${framesPerSec}`, 5, 10)

  for (let i = 0; i < vidas; i++) {
    ctx.fillStyle = PALETTE.magenta
    ctx.beginPath()
    ctx.arc(320 + 40 * i, 15, 10, 0, Math.PI * 2)
    ctx.fill()
    ctx.closePath()
  }
}

function collisionDetection() {
  for (let c = 0; c < columnasLadrillos; c++) {
    for (let r = 0; r < filasLadrillos; r++) {
      const currentBrick = ladrillos[c][r]
      if (currentBrick.status === ESTADO_LADRILLO.DESTRUIDO) continue

      const isBallSameXAsBrick =
        x > currentBrick.x &&
        x < currentBrick.x + anchoLadrillo

      const isBallSameYAsBrick =
        y > currentBrick.y &&
        y < currentBrick.y + altoLadrillo

      if (isBallSameXAsBrick && isBallSameYAsBrick) {
        dy = -dy
        currentBrick.status = ESTADO_LADRILLO.DESTRUIDO
      }
    }
  }
}

function ballMovement() {
  // rebotar las pelotas en los laterales
  if (
    x + dx > canvas.width - radioPelota || // la pared derecha
    x + dx < radioPelota // la pared izquierda
  ) {
    dx = -dx
  }

  // rebotar en la parte de arriba
  if (y + dy < radioPelota) {
    dy = -dy
  }

  // la pelota toca la pala
  const isBallSameXAsraqueta =
    x > raquetaX &&
    x < raquetaX + anchoRaqueta

  const isBallTouchingraqueta =
    y + dy > raquetaY

  if (isBallSameXAsraqueta && isBallTouchingraqueta) {
    dy = -dy // cambiamos la dirección de la pelota
  } else if ( // la pelota toca el suelo
    y + dy > canvas.height - radioPelota || y + dy > raquetaY + alturaRaqueta
  ) {
    if (vidas > 1) {
      vidas--
      x = canvas.width / 2
      y = canvas.height - 70
      raquetaX = (canvas.width - anchoRaqueta) / 2
      raquetaY = canvas.height - alturaRaqueta - 10
    } else {
      vidas--
      document.location.reload()
    }
  }

  // mover la pelota
  x += dx
  y += dy
}

function raquetaMovement() {
  if (derechoPresionado && raquetaX < canvas.width - anchoRaqueta) {
    raquetaX += velocidadRaqueta
  } else if (izquierdoPresionado && raquetaX > 0) {
    raquetaX -= velocidadRaqueta
  }
}

function cleanCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
}

function initEvents() {
  document.addEventListener('keydown', keyDownHandler)
  document.addEventListener('keyup', keyUpHandler)

  function keyDownHandler(event) {
    const { key } = event
    if (key === 'Right' || key === 'ArrowRight' || key.toLowerCase() === 'd') {
      derechoPresionado = true
    } else if (key === 'Left' || key === 'ArrowLeft' || key.toLowerCase() === 'a') {
      izquierdoPresionado = true
    }
  }

  function keyUpHandler(event) {
    const { key } = event
    if (key === 'Right' || key === 'ArrowRight' || key.toLowerCase() === 'd') {
      derechoPresionado = false
    } else if (key === 'Left' || key === 'ArrowLeft' || key.toLowerCase() === 'a') {
      izquierdoPresionado = false
    }
  }
}

// Velocidad de fps que queremos que renderice el juego
const fps = 60

let msPrev = window.performance.now()
let msFPSPrev = window.performance.now() + 1000
const msPerFrame = 1000 / fps
let frames = 0
let framesPerSec = fps

function draw() {
  window.requestAnimationFrame(draw)

  const msNow = window.performance.now()
  const msPassed = msNow - msPrev

  if (msPassed < msPerFrame) return

  const excessTime = msPassed % msPerFrame
  msPrev = msNow - excessTime

  frames++

  if (msFPSPrev < msNow) {
    msFPSPrev = window.performance.now() + 1000
    framesPerSec = frames
    frames = 0
  }

  // ... render code
  cleanCanvas()
  // hay que dibujar los elementos
  drawBall()
  drawraqueta()
  drawBricks()
  drawUI()

  // colisiones y movimientos
  collisionDetection()
  ballMovement()
  raquetaMovement()
}

function colorLadrillo(r, c) {
  let color = 1
  switch (nivelElegido) {
    case '1':
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
      break

    case '2':
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
      break

    case '3':
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
      break
  }
  return color
}

const botonAyuda = document.getElementById('botonAyuda')
botonAyuda.addEventListener('click', () => {
  const dialogAyuda = document.getElementById('dialogAyuda')
  dialogAyuda.showModal()
})

const cerrarAyuda = document.getElementById('cerrarAyuda')
cerrarAyuda.addEventListener('click', () => {
  const dialogAyuda = document.getElementById('dialogAyuda')
  dialogAyuda.close()
})

const botonAjustes = document.getElementById('botonAjustes')
botonAjustes.addEventListener('click', () => {
  const dialogAjustes = document.getElementById('dialogAjustes')
  dialogAjustes.showModal()
})

const cerrarAjustes = document.getElementById('cerrarAjustes')
cerrarAjustes.addEventListener('click', () => {
  const dialogAjustes = document.getElementById('dialogAjustes')
  dialogAjustes.close()
})
