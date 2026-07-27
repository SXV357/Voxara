from database import supabase

VOICE_ACTING_SCENARIOS = [
    {
        "mode": "voice_acting",
        "title": "Villain Monologue — You Did This",
        "context": (
            "You're a former mentor or ally who's just been betrayed — calm, "
            "controlled, and quietly dangerous. Think quiet menace, not "
            "screaming rage. Aim for 20–30 seconds. Keep your voice low and "
            "steady, and let the pause do the work — don't rush through the "
            "silence, let it feel heavy. Your pitch should stay controlled "
            "even as the words get colder."
        ),
        "script": (
            "You didn't have to make this hard. I gave you every chance to "
            "walk away — you just kept walking toward me instead. [pause] "
            "So don't look at me like I'm the one who did this. You did "
            "this. I only finished it. And now... there's no one left to "
            "stop me."
        ),
        "dimensions": ["tonal_differentiation", "pitch_variance", "intentional_pausing"],
    },
    {
        "mode": "voice_acting",
        "title": "Commercial — Triple Smoke Stack",
        "context": (
            "You're a hyped ad voice pitching a limited-time burger deal — "
            "upbeat, fast, energetic, the kind of read that makes people "
            "want to drive there right now. Aim for 20–30 seconds. Stay "
            "fast but stay clear; don't let the words blur together as you "
            "speed up. Keep the energy high throughout, and land the last "
            "line with a punch."
        ),
        "script": (
            "This weekend only! Our brand-new Triple Smoke Stack is back — "
            "three patties, double cheese, smothered in smoky BBQ sauce, "
            "stacked high and priced low. Grab one, grab two, just don't "
            "wait — because Sunday night, it's gone. Triple Smoke Stack. "
            "This weekend. Only here."
        ),
        "dimensions": ["pacing", "pitch_variance", "enunciation", "filler_words"],
    },
    {
        "mode": "voice_acting",
        "title": "Audiobook Dialogue — The Same Story, Twice",
        "context": (
            "You're voicing two characters in one take: a calm, measured "
            "detective, and a nervous suspect whose story keeps changing. "
            "Switch clearly between the two voices each time the speaker "
            "changes. Aim for 30–45 seconds. Make the two voices feel "
            "distinct — slow and flat for the detective, faster and broken "
            "for the suspect. Don't let one voice bleed into the other."
        ),
        "script": (
            'DETECTIVE: "Let\'s try this again. Slowly. Where were you at '
            'eight o\'clock?"\n\n'
            'SUSPECT: "I told you already — I was at the store, I swear, '
            'why do you keep asking me the same—"\n\n'
            'DETECTIVE: "Because your story changed. Twice. First you said '
            'seven. Then eight-thirty."\n\n'
            'SUSPECT: "I— maybe I got confused, okay? People get confused, '
            'that\'s not a crime—"\n\n'
            'DETECTIVE: "No. But lying to me is. So let\'s try the truth '
            'this time."'
        ),
        "dimensions": ["character_differentiation", "breath_support", "pacing"],
    },
    {
        "mode": "voice_acting",
        "title": "Nature Documentary — The Chase",
        "context": (
            "You're narrating a wildlife scene: a herd grazing peacefully, "
            "suddenly interrupted by a predator's chase, then settling back "
            "into calm. Classic slow, hushed documentary tone, with one "
            "fast section in the middle. Aim for 45–60 seconds. Start slow "
            "and steady, holding your breath control through the long "
            "opening lines. Shift into a quicker, sharper pace for the "
            "chase. Then slow back down for the ending."
        ),
        "script": (
            "Across the open plain, the herd moves slowly, unaware, "
            "unhurried, grazing beneath a sky that gives no warning of "
            "what's coming. [pause] Then — she moves. A sudden burst of "
            "speed, low to the ground, closing the distance before the herd "
            "even registers the danger. The gazelle breaks first, then the "
            "rest scatter, hooves tearing through dry grass as the gap "
            "narrows — meter by meter, second by second — until there is "
            "nowhere left to run. [pause] And then, as quickly as it began, "
            "it's over. The plain falls still again. The herd regroups, "
            "and the grass, once more, is silent."
        ),
        "dimensions": ["breath_support", "pacing", "enunciation"],
    },
]


def seed_scenarios() -> None:
    supabase.table("scenarios").delete().eq("mode", "voice_acting").execute()
    supabase.table("scenarios").insert(VOICE_ACTING_SCENARIOS).execute()
    print(f"Seeded {len(VOICE_ACTING_SCENARIOS)} scenarios.")
