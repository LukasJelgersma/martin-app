import { io, Socket } from "socket.io-client";

const API_BASE = "http://158.220.124.82:3000";

export type Words = Record<string, number>;

const localWordsBus = new EventTarget();

export async function fetchWords(): Promise<Words> {
    const res = await fetch(`${API_BASE}/all`);
    if (!res.ok) throw new Error(`fetchWords failed: ${res.status}`);
    return (await res.json()) as Words;
}

export async function addWord(newName: string): Promise<void> {
    await fetch(`${API_BASE}/add`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newName }),
    });

    // fetch latest and broadcast locally so components update immediately
    try {
        const latest = await fetchWords();
        localWordsBus.dispatchEvent(new CustomEvent<Words>("updateWordsLocal", { detail: latest }));
    } catch (e) {
        // ignore local dispatch if fetch fails; server socket may still emit update
        console.error("addWord: failed to fetch latest words for local dispatch:", e);
    }
}

export function subscribeToWordUpdates(onUpdate: (w: Words) => void) {
    const socket: Socket = io(API_BASE, { transports: ["websocket", "polling"] });
    socket.on("updateWords", (data: Words) => {
        onUpdate(data);
    });

    const localHandler = (ev: Event) => {
        const ce = ev as CustomEvent<Words>;
        onUpdate(ce.detail);
    };
    localWordsBus.addEventListener("updateWordsLocal", localHandler);

    return () => {
        socket.disconnect();
        localWordsBus.removeEventListener("updateWordsLocal", localHandler);
    };
}