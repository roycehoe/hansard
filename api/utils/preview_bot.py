from typing import Optional


def get_preview_bot_name(user_agent: str) -> Optional[str]:
    lowered_user_agent = user_agent.lower()
    if "facebookexternalhit" in lowered_user_agent:
        return "Facebook"
    if "telegrambot" in lowered_user_agent:
        return "Telegram"
    if "twitterbot" in lowered_user_agent:
        return "Twitter"
    if "slackbot" in lowered_user_agent:
        return "Slack"
    if "whatsapp" in lowered_user_agent:
        return "WhatsApp"
    if "discordbot" in lowered_user_agent:
        return "Discord"
    if "linkedinbot" in lowered_user_agent:
        return "LinkedIn"
    if "skypeuripreview" in lowered_user_agent:
        return "Microsoft Teams"
    if "redditbot" in lowered_user_agent:
        return "Reddit"
    if "mastodon" in lowered_user_agent:
        return "Mastodon"
    if "cardyb" in lowered_user_agent:
        return "Bluesky"
    if "applebot" in lowered_user_agent:
        return "Apple"
    return None
