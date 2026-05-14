from typing import Any, Optional


def success_response(data: Any = None, message: str = "Success", status_code: int = 200) -> dict:
    response = {
        "success": True,
        "message": message,
        "status_code": status_code,
    }
    if data is not None:
        response["data"] = data
    return response


def error_response(message: str = "Error", status_code: int = 400, errors: Any = None) -> dict:
    response = {
        "success": False,
        "message": message,
        "status_code": status_code,
    }
    if errors is not None:
        response["errors"] = errors
    return response


def paginated_response(data: list, total: int, page: int, limit: int, message: str = "Success") -> dict:
    return {
        "success": True,
        "message": message,
        "data": data,
        "pagination": {
            "total": total,
            "page": page,
            "limit": limit,
            "pages": (total + limit - 1) // limit
        }
    }
