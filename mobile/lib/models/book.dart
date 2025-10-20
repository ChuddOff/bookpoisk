class Book {
  final String id;
  final String title;
  final String author;
  final String year; // оставляем String, как приходит с бэкенда
  final String description;
  final String genre;
  final String? cover;
  final List<String>? photos;
  final int pages;

  Book({
    required this.id,
    required this.title,
    required this.author,
    required this.year,
    required this.description,
    required this.genre,
    this.cover,
    this.photos,
    required this.pages,
  });

  // Парсинг JSON в объект Dart
  factory Book.fromJson(Map<String, dynamic> json) {
    return Book(
      id: json['id'] as String,
      title: json['title'] as String,
      author: json['author'] as String,
      year: json['year'] as String,
      description: json['description'] as String,
      genre: json['genre'] as String,
      cover: json['cover'] as String?,
      photos: json['photos'] != null ? List<String>.from(json['photos']) : null,
      pages: json['pages'] as int,
    );
  }

  // Преобразование объекта в JSON (если нужно для отправки на бэкенд)
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'author': author,
      'year': year,
      'description': description,
      'genre': genre,
      'cover': cover,
      'photos': photos,
      'pages': pages,
    };
  }
}
