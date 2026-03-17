import '../platform/platform_info.dart';

class ApiConfig {
  // Override at runtime:
  // `flutter run --dart-define=API_BASE=http://10.0.2.2:5000/api`
  static const String apiBaseOverride =
      String.fromEnvironment('API_BASE', defaultValue: '');

  static String apiBase() {
    if (apiBaseOverride.isNotEmpty) return apiBaseOverride;

    final info = platformInfo();
    if (info.isAndroid) return 'http://10.0.2.2:5000/api';
    if (info.isIOSSimulator) return 'http://localhost:5000/api';
    return 'http://localhost:5000/api';
  }
}

