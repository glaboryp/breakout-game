const { test, expect } = require('@playwright/test')

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('muestra la pantalla de inicio con los 3 niveles', async ({ page }) => {
  await expect(page.locator('#paginaInicio')).toBeVisible()
  await expect(page.locator('#niveles button')).toHaveCount(3)
  await expect(page.locator('[id="1"]')).toHaveClass(/active/)
})

test('al pulsar Jugar oculta la pantalla de inicio y arranca el juego', async ({ page }) => {
  await page.click('#botonJugar')

  await expect(page.locator('#paginaInicio')).toHaveClass(/oculto/)
  await expect.poll(() => page.evaluate(() => game.active)).toBe(true)
})

test('la pala se mueve hacia la derecha al pulsar la flecha derecha', async ({ page }) => {
  await page.click('#botonJugar')
  const initialX = await page.evaluate(() => game.paddle.x)

  await page.keyboard.down('ArrowRight')
  await expect.poll(() => page.evaluate(() => game.paddle.x)).toBeGreaterThan(initialX)
  await page.keyboard.up('ArrowRight')
})

test('la colisión con un brick lo destruye y suma 10 puntos', async ({ page }) => {
  await page.click('#botonJugar')

  const result = await page.evaluate(() => {
    const brick = game.bricks[0][0]
    game.ball.x = brick.x + 1
    game.ball.y = brick.y + 1
    const scoreBefore = game.score

    game.collisionDetection()

    return { status: brick.status, scoreGained: game.score - scoreBefore }
  })

  expect(result.status).toBe(0) // CONSTANTS.STATE.DESTROYED
  expect(result.scoreGained).toBe(10)
})

test('al limpiar todos los bricks del nivel 1 pasa al nivel 2 conservando el score', async ({ page }) => {
  await page.click('#botonJugar')

  await page.evaluate(() => {
    for (const col of game.bricks) {
      for (const brick of col) brick.status = 0 // DESTROYED
    }
    game.score = 50
  })

  await expect.poll(() => page.evaluate(() => game.level)).toBe(2)
  await expect.poll(() => page.evaluate(() => game.score)).toBe(50)
  await expect.poll(() => page.evaluate(() => game.bricks[0][0].status)).toBe(1) // ACTIVE
})

test('al limpiar el nivel 3 se muestra el diálogo de victoria', async ({ page }) => {
  await page.click('#botonJugar')

  await page.evaluate(() => {
    game.level = 3
    for (const col of game.bricks) {
      for (const brick of col) brick.status = 0 // DESTROYED
    }
    game.score = 300
  })

  const dialogVictoria = page.locator('#dialogVictoria')
  await expect(dialogVictoria).toBeVisible()
  await expect(dialogVictoria).toContainText('300')
  await expect.poll(() => page.evaluate(() => game.active)).toBe(false)
})

test('al perder todas las vidas se muestra el diálogo de game over', async ({ page }) => {
  await page.click('#botonJugar')

  await page.evaluate(() => {
    game.score = 40
    game.gameOver()
  })

  const dialogGameOver = page.locator('#dialogGameOver')
  await expect(dialogGameOver).toBeVisible()
  await expect(dialogGameOver).toContainText('40')
  await expect(page.locator('#paginaInicio')).toHaveClass(/oculto/)
})

test('"Reintentar nivel" tras game over reinicia score y vidas y sigue jugando', async ({ page }) => {
  await page.click('#botonJugar')

  await page.evaluate(() => {
    game.score = 40
    game.gameOver()
  })
  await page.click('#reintentarNivel')

  await expect(page.locator('#dialogGameOver')).not.toBeVisible()
  await expect.poll(() => page.evaluate(() => game.score)).toBe(0)
  await expect.poll(() => page.evaluate(() => game.lives)).toBe(3)
  await expect.poll(() => page.evaluate(() => game.active)).toBe(true)
})

test('"Menú principal" tras game over vuelve a la pantalla de inicio', async ({ page }) => {
  await page.click('#botonJugar')

  await page.evaluate(() => game.gameOver())
  await page.click('#menuGameOver')

  await expect(page.locator('#dialogGameOver')).not.toBeVisible()
  await expect(page.locator('#paginaInicio')).not.toHaveClass(/oculto/)
})

test('al volver al menú tras game over se limpia el canvas', async ({ page }) => {
  await page.click('#botonJugar')

  await page.evaluate(() => game.gameOver())
  await page.click('#menuGameOver')

  const isCanvasCleared = await page.evaluate(() => {
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
    return data.every(value => value === 0)
  })

  expect(isCanvasCleared).toBe(true)
})
