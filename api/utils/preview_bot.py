from typing import Optional

_PREVIEW_BOTS = (
    ("Facebook", "facebookexternalhit"),
    ("Telegram", "telegrambot"),
    ("Twitter", "twitterbot"),
    ("Slack", "slackbot"),
    ("WhatsApp", "whatsapp"),
    ("Discord", "discordbot"),
    ("LinkedIn", "linkedinbot"),
    ("Microsoft Teams", "skypeuripreview"),
    ("Reddit", "redditbot"),
    ("Mastodon", "mastodon"),
    ("Bluesky", "cardyb"),
    ("Apple", "applebot"),
)


def get_preview_bot_name(user_agent: str) -> Optional[str]:
    lowered_user_agent = user_agent.lower()
    for bot_name, user_agent_substring in _PREVIEW_BOTS:
        if user_agent_substring in lowered_user_agent:
            return bot_name
    return None
