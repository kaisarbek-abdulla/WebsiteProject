import 'dart:io';

import 'platform_info.dart';

class _PlatformInfoIO implements PlatformInfo {
  @override
  bool get isAndroid => Platform.isAndroid;

  @override
  bool get isIOSSimulator {
    // Best-effort: treat iOS as simulator "localhost" compatible.
    // If you later run on a real device, override with `--dart-define=API_BASE=...`.
    return Platform.isIOS;
  }
}

PlatformInfo getPlatformInfo() => _PlatformInfoIO();

