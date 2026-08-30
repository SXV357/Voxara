import string

SINGLE = {
    "um",
    "uh",
    "like",
    "basically",
    "actually",
    "literally",
    "right",
    "so",
}
DOUBLE = {("you", "know")}


def _normalize(word: str) -> str:
    return word.lower().strip(string.punctuation + string.whitespace)


def count_fillers(words: list[dict]) -> int:
    """Count filler words in a transcript word list.

    Each item is a dict with a `word` key (as produced by the transcription
    service). Counts single-word fillers plus adjacent two-word fillers
    ("you know"), which also consume both slots so "you" isn't double-counted.
    """
    tokens = [_normalize(w["word"]) for w in words]

    count = 0
    i = 0
    while i < len(tokens):
        if i + 1 < len(tokens) and (tokens[i], tokens[i + 1]) in DOUBLE:
            count += 1
            i += 2
            continue
        if tokens[i] in SINGLE:
            count += 1
        i += 1
    return count
