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
