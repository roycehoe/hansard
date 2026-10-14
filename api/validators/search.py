from exceptions.search import SearchFilterRequiredException


def validate_can_search(query: str, filters: tuple[object, ...]) -> None:
    if query.strip() == "" and all(search_filter is None for search_filter in filters):
        raise SearchFilterRequiredException
