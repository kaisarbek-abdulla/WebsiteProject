import '../api/api_client.dart';
import '../services/token_store.dart';

class AuthService {
  AuthService({required TokenStore tokenStore})
      : _tokenStore = tokenStore,
        _api = ApiClient(tokenStore: tokenStore);

  final TokenStore _tokenStore;
  final ApiClient _api;

  Future<void> register({
    required String email,
    required String password,
    String? name,
    String? role,
  }) async {
    final json = await _api.postJson(
      '/auth/register',
      authed: false,
      body: {
        'name': name ?? '',
        'email': email,
        'password': password,
        if (role != null && role.isNotEmpty) 'role': role,
      },
    );
    final token = (json['token'] ?? '').toString();
    if (token.isEmpty) throw Exception('Register did not return a token');
    await _tokenStore.writeToken(token);
  }

  Future<void> login({
    required String email,
    required String password,
  }) async {
    final json = await _api.postJson(
      '/auth/login',
      authed: false,
      body: {'email': email, 'password': password},
    );
    final token = (json['token'] ?? '').toString();
    if (token.isEmpty) throw Exception('Login did not return a token');
    await _tokenStore.writeToken(token);
  }

  Future<Map<String, dynamic>> profile() async {
    return _api.getJson('/auth/profile');
  }

  Future<Map<String, dynamic>> analyzeSymptoms(String text) async {
    return _api.postJson('/symptoms', body: {'text': text});
  }

  Future<void> logout() => _tokenStore.clear();
}

