from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


class OutsideOfficeRadiusError(Exception):
    def __init__(self, distance_km: float):
        self.distance_km = distance_km
        super().__init__(f"Location is {distance_km:.2f} km from office (max allowed: configured radius)")


class PayslipGenerationError(Exception):
    pass


def custom_exception_handler(exc, context):
    """
    Custom DRF exception handler that returns consistent error shape:
    { "error": "...", "details": {...} }
    """
    response = exception_handler(exc, context)

    if response is not None:
        error_data = {
            'error': True,
            'message': _extract_message(response.data),
            'details': response.data,
        }
        response.data = error_data

    elif isinstance(exc, OutsideOfficeRadiusError):
        return Response(
            {
                'error': True,
                'message': f'You are {exc.distance_km:.2f} km from the office. Check-in is only allowed within the office radius.',
                'details': {'distance_km': exc.distance_km},
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    return response


def _extract_message(data) -> str:
    if isinstance(data, str):
        return data
    if isinstance(data, list) and data:
        return str(data[0])
    if isinstance(data, dict):
        for key in ('detail', 'message', 'non_field_errors'):
            if key in data:
                val = data[key]
                return val[0] if isinstance(val, list) else str(val)
        first_val = next(iter(data.values()))
        return first_val[0] if isinstance(first_val, list) else str(first_val)
    return 'An error occurred.'
