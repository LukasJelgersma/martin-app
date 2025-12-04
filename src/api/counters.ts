import { fetchWords, type Words } from "./words";

const API_BASE = "http://158.220.124.82:3000";

const localCountersBus = new EventTarget();

export async function incrementCounter(name: string): Promise<void> {
    await fetch(`${API_BASE}/increment/${encodeURIComponent(name)}`, {
        method: "POST",
    });

    // fetch latest and broadcast locally so components update immediately
    try {
        const latest = await fetchWords();
        localCountersBus.dispatchEvent(new CustomEvent<Words>("updateCountersLocal", { detail: latest }));
    } catch (e) {
        // ignore local dispatch if fetch fails; server socket may still emit update
        console.error("incrementCounter: failed to fetch latest counters for local dispatch:", e);
    }
}