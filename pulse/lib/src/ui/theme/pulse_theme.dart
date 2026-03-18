import 'package:flutter/material.dart';

class PulseTheme {
  static const Color brandBlue = Color(0xFF2B67FF);
  static const Color ink = Color(0xFF0F172A);
  static const Color muted = Color(0xFF64748B);
  static const Color bg = Color(0xFFFAFBFC);
  static const Color card = Color(0xFFFFFFFF);
  static const Color border = Color(0xFFE2E8F0);
  static const Color danger = Color(0xFFEF4444);

  // Dark palette matching the web screenshots (navy gradient + slate cards).
  static const Color darkBgTop = Color(0xFF0B1220);
  static const Color darkBgBottom = Color(0xFF0E1930);
  static const Color darkShell = Color(0xFF22243A);
  static const Color darkCard = Color(0xFF2A2C43);
  static const Color darkBorder = Color(0xFF3B3F5E);
  static const Color darkText = Color(0xFFE9EFFD);
  static const Color darkMuted = Color(0xFF9AA4B2);

  static ThemeData light() {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: brandBlue,
      brightness: Brightness.light,
    ).copyWith(
      primary: brandBlue,
      onPrimary: Colors.white,
      surface: card,
      onSurface: ink,
    );

    final base = ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
    );

    final tt = base.textTheme.apply(bodyColor: ink, displayColor: ink);

    return base.copyWith(
      scaffoldBackgroundColor: bg,
      appBarTheme: const AppBarTheme(
        centerTitle: false,
        elevation: 0,
        backgroundColor: Colors.transparent,
        foregroundColor: ink,
      ),
      cardTheme: CardThemeData(
        color: card,
        surfaceTintColor: card,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: border, width: 1),
        ),
        margin: EdgeInsets.zero,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: brandBlue.withOpacity(0.7), width: 2),
        ),
        labelStyle: const TextStyle(color: muted),
        hintStyle: const TextStyle(color: muted),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: brandBlue,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          textStyle: const TextStyle(fontWeight: FontWeight.w700),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: brandBlue,
          textStyle: const TextStyle(fontWeight: FontWeight.w600),
        ),
      ),
      textTheme: tt.copyWith(
        headlineSmall: tt.headlineSmall?.copyWith(
          fontWeight: FontWeight.w800,
          letterSpacing: -0.25,
        ),
        titleMedium: tt.titleMedium?.copyWith(fontWeight: FontWeight.w800),
        bodySmall: tt.bodySmall?.copyWith(color: muted),
      ),
    );
  }

  static ThemeData dark() {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: brandBlue,
      brightness: Brightness.dark,
    ).copyWith(
      primary: brandBlue,
      onPrimary: Colors.white,
      surface: darkCard,
      onSurface: darkText,
      error: danger,
    );

    final base = ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      brightness: Brightness.dark,
    );

    final tt = base.textTheme.apply(bodyColor: darkText, displayColor: darkText);

    return base.copyWith(
      scaffoldBackgroundColor: darkBgBottom,
      appBarTheme: const AppBarTheme(
        centerTitle: false,
        elevation: 0,
        backgroundColor: Colors.transparent,
        foregroundColor: darkText,
      ),
      cardTheme: CardThemeData(
        color: darkCard,
        surfaceTintColor: darkCard,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: darkBorder, width: 1),
        ),
        margin: EdgeInsets.zero,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: const Color(0xFF262844),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: darkBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: darkBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: brandBlue, width: 2),
        ),
        labelStyle: const TextStyle(color: darkMuted),
        hintStyle: const TextStyle(color: darkMuted),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: brandBlue,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          textStyle: const TextStyle(fontWeight: FontWeight.w700),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: brandBlue,
          textStyle: const TextStyle(fontWeight: FontWeight.w600),
        ),
      ),
      textTheme: tt.copyWith(
        headlineSmall: tt.headlineSmall?.copyWith(
          fontWeight: FontWeight.w800,
          letterSpacing: -0.25,
        ),
        titleMedium: tt.titleMedium?.copyWith(fontWeight: FontWeight.w800),
        bodySmall: tt.bodySmall?.copyWith(color: darkMuted),
        bodyMedium: tt.bodyMedium?.copyWith(color: darkText),
      ),
    );
  }
}
