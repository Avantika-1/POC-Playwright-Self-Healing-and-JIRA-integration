import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests',
    timeout: 60000,
    fullyParallel: true,
//  REPORTING SECTION (Root Level )
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'on-failure' }], // HTML Report
    ['list'], // Console Terminal Output List
    ['json', { outputFile: 'test-results/results.json' }] // JSON Report for CI/CD
  ],

    use: {
        baseURL: 'https://opensource-demo.orangehrmlive.com',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },

    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
            },
        },
    ],
});