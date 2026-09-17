const { defineConfig, devices } = require('@playwright/test')

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  webServer: {
    command: 'pnpm exec serve . -l 4173',
    port: 4173,
    reuseExistingServer: !process.env.CI
  },
  use: {
    baseURL: 'http://localhost:4173'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } }
  ]
})
