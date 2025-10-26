def retry(func):
    def wrapper(*args, **kwargs):
        for attempt in range(5):
            try:
                return func(*args, **kwargs)
            except Exception:
                continue
        return f"The model is not available now"
    return wrapper
