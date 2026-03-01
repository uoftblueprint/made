from rest_framework.pagination import PageNumberPagination


class FlexiblePageNumberPagination(PageNumberPagination):
    """
    Custom pagination class that allows clients to specify page size.
    Supports 'page_size' query parameter with a max limit.
    """

    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 10000
