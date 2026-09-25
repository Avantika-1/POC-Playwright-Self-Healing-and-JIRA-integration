// helpers/dataGenerator.ts
// Generates realistic but clearly fake test data.
// Names are seeded from Date.now() — unique per run, traceable in logs/Jira tickets.

const FIRST_NAMES = ['Alex', 'Jordan', 'Morgan', 'Taylor', 'Casey', 'Riley', 'Drew', 'Avery'];
const LAST_NAMES  = ['Smith', 'Jones', 'Brown', 'Davis', 'Wilson', 'Moore', 'Taylor', 'Clark'];

function seededIndex(seed: number, arrayLength: number): number {
    return seed % arrayLength;
}

export interface EmployeeData {
    firstName: string;
    lastName:  string;
    fullName:  string;
    runId:     string; // timestamp suffix — ties data back to a specific run in logs/Jira
}

export function generateEmployeeData(): EmployeeData {
    const seed    = Date.now();
    const runId   = seed.toString().slice(-6); // last 6 digits — short but unique enough per run
    const first   = FIRST_NAMES[seededIndex(seed,       FIRST_NAMES.length)];
    const last    = `${LAST_NAMES[seededIndex(Math.floor(seed / 10), LAST_NAMES.length)]}-${runId}`;

    return {
        firstName: first,
        lastName:  last,
        fullName:  `${first} ${last}`,
        runId,
    };
}
