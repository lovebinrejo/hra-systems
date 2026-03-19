def create_notification(recipient, title: str, message: str,
                         notification_type: str = 'general', action_url: str = ''):
    """Synchronously create a Notification record."""
    from apps.notifications.models import Notification
    return Notification.objects.create(
        recipient=recipient,
        title=title,
        message=message,
        notification_type=notification_type,
        action_url=action_url,
    )
