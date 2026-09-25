import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir:       './tests',
    timeout:       120000,
    retries:       1,           // one retry in CI before marking as failed
    fullyParallel: false,       // sequential — OrangeHRM demo env has shared state

    reporter: [
        ['html',  { outputFolder: 'playwright-report', open: 'on-failure' }],
        ['list'],
        ['json',  { outputFile: 'test-results/results.json' }],
    ],

    use: {
        baseURL:    'https://opensource-demo.orangehrmlive.com',
        // Capture evidence on failure — screenshots/traces/videos can be attached to Jira tickets
        trace:      'on-first-retry',
        screenshot: 'only-on-failure',
        video:      'retain-on-failure',
    },

    projects: [
        {
            // Default CI project — excludes @demo tests so visual regression doesn't corrupt pass/fail signal
            name: 'chromium',
            grep: /^(?!.*@demo)/,
            use:  { ...devices['Desktop Chrome'] },
        },
        {
            // Demo project — run explicitly: npx playwright test --project=demo
            name: 'demo',
            grep: /@demo/,
            use:  { ...devices['Desktop Chrome'] },
        },
    ],
});
