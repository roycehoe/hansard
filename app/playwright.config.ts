import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: 'e2e',
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: 'https://openhansard.sg',
    launchOptions: { executablePath: process.env.CHROME_EXECUTABLE_PATH },
  },
})
