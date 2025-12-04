import { useEffect, useState, type JSX } from "react";
import { incrementCounter } from "../api/counters";
import "../App.css";
import { addWord, fetchWords, subscribeToWordUpdates, type Words } from "../api/words";

export default function CountersComponent(): JSX.Element {
    const [words, setWords] = useState<Words>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsub: (() => void) | undefined;
        fetchWords()
            .then((words) => setWords(words))
            .catch((e) => console.error("Failed to fetch words:", e))
            .finally(() => setLoading(false));

        unsub = subscribeToWordUpdates((words) => {
            setWords(words);
        });

        return () => {
            if (unsub) unsub();
        };
    }, []);

    async function handleIncrement(key: string) {
        // optimistic UI update
        setWords((prev) => ({ ...prev, [key]: (prev[key] ?? 0) + 1 }));
        try {
            await incrementCounter(key);
        } catch (e) {
            console.error("Increment failed:", e);
            // revert on error by re-fetching from fetchWords
            try {
                const fresh = await fetchWords();
                setWords(fresh);
            } catch { }
        }
    }


    async function refreshWords() {
        setLoading(true);
        try {
            const freshWords = await fetchWords();
            setWords(freshWords);
        } catch (e) {
            console.error("Failed to refresh words:", e);
        } finally {
            setLoading(false);
        }
    }

    async function handleAddWord(word: string) {
        try {
            await addWord(word);
        } catch (e) {
            console.error("Failed to add word:", e);
        } finally {
            refreshWords();
        }
    }

    return (
        <div >
            <span className="text-3xl font-bold mb-4">Gedingus Counters</span>

            <div className='flex gap-12 justify-center'>
                {loading ? <p>Loading…</p> : null}
                <div className="grid">

                    {Object.entries(words).map(([key, value]) => (
                        <div key={key} className="counter">
                            <h2>{key}</h2>
                            <div id={key} className="value">{value}</div>
                            <button onClick={() => handleIncrement(key)}>+1 {key}</button>
                        </div>
                    ))}
                </div>
                <div>
                    <h1>Wall of Fame</h1>

                    <form onSubmit={async (e) => {
                        e.preventDefault();
                        const target = e.target as HTMLFormElement;
                        const input = target.elements.namedItem("word") as HTMLInputElement;
                        const word = input.value.trim();
                        if (word) {
                            await handleAddWord(word);
                            input.value = "";
                        }
                    }}>
                        <input
                            type="text"
                            name="word"
                            placeholder="Add a word"
                            className="border rounded-lg px-4 py-2 mr-2" />
                        <button
                            type="submit"
                            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                        >
                            Add Word
                        </button>
                    </form>


                    <button
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                        onClick={refreshWords}
                    >
                        Refresh
                    </button>
                    {loading ? <p>Loading…</p> : null}
                    <div className="flex flex-col gap-4 overflow-auto">
                        {Object.entries(words).map(([word, count], index) => (
                            <div key={index} className="border rounded-lg px-4 py-2 bg-gray-900 text-white">
                                <div>{word}</div>
                                <div className="text-sm text-gray-400">Count: {count}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}