import 'package:flutter/material.dart';

class AppTheme {
  static const Color brand = Color(0xFFE53945); // пример, подтяни из index.css
  static const Color ink = Color(0xFF111418);
  static const double radiusLg = 12.0;

  static const List<BoxShadow> shadowMd = [
    BoxShadow(
      color: Color.fromRGBO(0, 0, 0, 0.1),
      offset: Offset(0, 2),
      blurRadius: 4,
    ),
  ];

  static ThemeData light() => ThemeData(
    primaryColor: brand,
    scaffoldBackgroundColor: Colors.white,
    appBarTheme: AppBarTheme(
      backgroundColor: brand,
      foregroundColor: Colors.white,
      elevation: 0,
    ),
    cardTheme: CardThemeData(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(radiusLg),
      ),
      shadowColor: shadowMd.first.color,
    ),

    textTheme: const TextTheme(
      bodyMedium: TextStyle(color: ink, fontSize: 16),
      titleLarge: TextStyle(
        color: ink,
        fontWeight: FontWeight.bold,
        fontSize: 20,
      ),
    ),
  );
}
