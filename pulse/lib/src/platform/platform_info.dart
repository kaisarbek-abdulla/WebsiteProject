import 'platform_info_io.dart' if (dart.library.html) 'platform_info_web.dart';

abstract class PlatformInfo {
  bool get isAndroid;
  bool get isIOSSimulator;
}

PlatformInfo platformInfo() => getPlatformInfo();

