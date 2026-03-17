import 'platform_info.dart';

class _PlatformInfoWeb implements PlatformInfo {
  @override
  bool get isAndroid => false;

  @override
  bool get isIOSSimulator => false;
}

PlatformInfo getPlatformInfo() => _PlatformInfoWeb();

