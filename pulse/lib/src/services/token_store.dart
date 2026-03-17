import 'package:shared_preferences/shared_preferences.dart';

class TokenStore {
  static const _tokenKey = 'authToken';

  Future<SharedPreferences> prefs() => SharedPreferences.getInstance();

  Future<String?> readToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  Future<void> writeToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
  }

  Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
  }
}
