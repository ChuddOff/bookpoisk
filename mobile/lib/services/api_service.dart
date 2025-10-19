import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/book.dart';

class APIService {
  static const String baseUrl = 'https://bookpoisk-idwp.onrender.com/';
  final FlutterSecureStorage storage = FlutterSecureStorage();

  // Получение JWT токена из хранилища
  Future<String?> getToken() async {
    return await storage.read(key: 'jwt');
  }

  // Логин
  Future<bool> login(String email, String password) async {
    final url = Uri.parse('$baseUrl/auth/login');
    final response = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      await storage.write(key: 'jwt', value: data['token']);
      return true;
    } else {
      return false;
    }
  }

  // Получение списка книг
  Future<List<Book>> getBooks() async {
    final token = await getToken();
    final url = Uri.parse('$baseUrl/books');

    final response = await http.get(
      url,
      headers: {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      final List jsonData = jsonDecode(response.body);
      return jsonData.map((e) => Book.fromJson(e)).toList();
    } else {
      throw Exception('Ошибка загрузки книг: ${response.statusCode}');
    }
  }
}
