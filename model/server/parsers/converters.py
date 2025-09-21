from server.api.schemas import Request, Response, Book


def convert_request(data: Request) -> str:
    read_books = f"read_books:\n{"\n".join([f"{i.title} - {i.author}" for i in data.read_books])}"
    return f"{read_books}"


def convert_response(data: str) -> Response:
    recommended_books = [Book(id="", title=i.split(" - ")[0], author=i.split(" - ")[1], year="", description="",
                              genre="", pages=0) for i in data.splitlines()[1:-1]]
    return Response(recommended_books=recommended_books)
