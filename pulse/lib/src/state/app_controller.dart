import 'package:flutter/material.dart';

import '../services/token_store.dart';

enum AppSection {
  dashboard,
  symptoms,
  reminders,
  devices,
  vitals,
  nutrition,
  reports,
  complaints,
  profile,
}

class AppController extends ChangeNotifier {
  AppController({required TokenStore tokenStore}) : _tokenStore = tokenStore;

  final TokenStore _tokenStore;

  static const _themeKey = 'themeMode';
  static const _langKey = 'lang';

  final ValueNotifier<ThemeMode> themeMode = ValueNotifier<ThemeMode>(ThemeMode.dark);

  AppSection _section = AppSection.dashboard;
  AppSection get section => _section;

  String _language = 'English';
  String get language => _language;

  Future<void> loadPrefs() async {
    final prefs = await _tokenStore.prefs();
    final rawTheme = prefs.getString(_themeKey) ?? 'dark';
    themeMode.value = switch (rawTheme) {
      'light' => ThemeMode.light,
      _ => ThemeMode.dark,
    };
    _language = prefs.getString(_langKey) ?? 'English';
    notifyListeners();
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    themeMode.value = mode;
    final prefs = await _tokenStore.prefs();
    await prefs.setString(_themeKey, mode == ThemeMode.light ? 'light' : 'dark');
  }

  Future<void> toggleTheme() async {
    await setThemeMode(themeMode.value == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark);
  }

  void setSection(AppSection section) {
    if (_section == section) return;
    _section = section;
    notifyListeners();
  }

  Future<void> setLanguage(String lang) async {
    _language = lang;
    final prefs = await _tokenStore.prefs();
    await prefs.setString(_langKey, lang);
    notifyListeners();
  }
}
