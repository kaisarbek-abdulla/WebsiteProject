import 'dart:async';
import 'dart:math';

import 'package:flutter/foundation.dart';

@immutable
class VitalsSnapshot {
  const VitalsSnapshot({
    required this.heartRateBpm,
    required this.steps,
    required this.activeMinutes,
    required this.distanceKm,
    required this.kcal,
    required this.hrWave,
    required this.paused,
  });

  final int heartRateBpm;
  final int steps;
  final int activeMinutes;
  final double distanceKm;
  final int kcal;
  final List<double> hrWave; // normalized 0..1 samples (for small line chart)
  final bool paused;
}

class VitalsSimulator extends ValueNotifier<VitalsSnapshot> {
  VitalsSimulator()
      : _rng = Random(),
        super(
          const VitalsSnapshot(
            heartRateBpm: 76,
            steps: 512,
            activeMinutes: 14,
            distanceKm: 0.34,
            kcal: 780,
            hrWave: <double>[0.55, 0.6, 0.52, 0.66, 0.58, 0.62],
            paused: false,
          ),
        ) {
    _timer = Timer.periodic(const Duration(milliseconds: 900), (_) => _tick());
  }

  final Random _rng;
  Timer? _timer;

  void togglePaused() {
    value = VitalsSnapshot(
      heartRateBpm: value.heartRateBpm,
      steps: value.steps,
      activeMinutes: value.activeMinutes,
      distanceKm: value.distanceKm,
      kcal: value.kcal,
      hrWave: value.hrWave,
      paused: !value.paused,
    );
  }

  void _tick() {
    if (value.paused) return;

    final hrDrift = _rng.nextInt(5) - 2; // -2..+2
    final hr = (value.heartRateBpm + hrDrift).clamp(58, 122);

    final stepBurst = _rng.nextDouble() < 0.12 ? _rng.nextInt(22) : _rng.nextInt(7);
    final steps = value.steps + stepBurst;

    // Cheap, plausible-ish derivations (demo only).
    final activeMinutes = max(value.activeMinutes, (steps / 36).floor()); // ~ 36 steps/min
    final distanceKm = steps * 0.00067; // ~0.67m/step
    final kcal = 650 + (steps * 0.25).floor(); // trending number, not a real model

    final nextWave = _nextWaveSample(hr);
    final wave = <double>[
      ...value.hrWave,
      nextWave,
    ];
    while (wave.length > 54) {
      wave.removeAt(0);
    }

    value = VitalsSnapshot(
      heartRateBpm: hr,
      steps: steps,
      activeMinutes: activeMinutes,
      distanceKm: double.parse(distanceKm.toStringAsFixed(2)),
      kcal: kcal,
      hrWave: List<double>.unmodifiable(wave),
      paused: false,
    );
  }

  double _nextWaveSample(int hr) {
    // Normalize heart rate into 0..1 plus a bit of noise.
    final normalized = (hr - 58) / (122 - 58);
    final noise = (_rng.nextDouble() - 0.5) * 0.18;
    return (normalized + noise).clamp(0.05, 0.95);
  }

  @override
  void dispose() {
    _timer?.cancel();
    _timer = null;
    super.dispose();
  }
}

/// Shared singleton used by both Dashboard and Vitals pages (demo UI).
final vitalsSimulator = VitalsSimulator();

