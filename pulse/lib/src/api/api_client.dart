import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config/api_config.dart';
import '../services/token_store.dart';
import 'api_exception.dart';

class ApiClient {
  ApiClient({required TokenStore tokenStore}) : _tokenStore = tokenStore;

  final TokenStore _tokenStore;
  final http.Client _http = http.Client();

  Uri _uri(String path) {
    final base = ApiConfig.apiBase().replaceAll(RegExp(r'/$'), '');
    final cleanPath = path.startsWith('/') ? path : '/$path';
    return Uri.parse('$base$cleanPath');
  }

  Future<Map<String, dynamic>> getJson(
    String path, {
    bool authed = true,
  }) async {
    final headers = await _headers(authed: authed);
    final res = await _http.get(_uri(path), headers: headers);
    return _handleJson(res);
  }

  Future<Map<String, dynamic>> postJson(
    String path, {
    Object? body,
    bool authed = true,
  }) async {
    final headers = await _headers(authed: authed);
    final res = await _http.post(_uri(path), headers: headers, body: jsonEncode(body ?? {}));
    return _handleJson(res);
  }

  Future<Map<String, String>> _headers({required bool authed}) async {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (authed) {
      final token = await _tokenStore.readToken();
      if (token != null && token.isNotEmpty) {
        headers['Authorization'] = 'Bearer $token';
      }
    }
    return headers;
  }

  Map<String, dynamic> _handleJson(http.Response res) {
    Map<String, dynamic> json;
    try {
      final decoded = jsonDecode(res.body);
      json = decoded is Map<String, dynamic> ? decoded : <String, dynamic>{'data': decoded};
    } catch (_) {
      json = <String, dynamic>{'raw': res.body};
    }

    if (res.statusCode >= 200 && res.statusCode < 300) {
      return json;
    }

    final message = (json['error'] ?? json['message'] ?? 'Request failed').toString();
    throw ApiException(message, statusCode: res.statusCode);
  }
}

