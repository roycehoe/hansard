from exceptions.endpoint import EndpointNotFoundException
from settings import settings


# NOTE: takes no parameters, because FastAPI would read one as a query parameter and let a visitor turn the endpoint on
def validate_can_read_unreleased_endpoint() -> None:
    if not settings.is_unreleased_endpoints_enabled:
        raise EndpointNotFoundException
