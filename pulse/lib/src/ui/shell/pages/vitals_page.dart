import 'dart:math';

import 'package:flutter/material.dart';

import '../../../services/auth_service.dart';
import '../../../state/vitals_simulator.dart';
import '../../theme/pulse_theme.dart';
import '../widgets/pulse_card.dart';
import '../widgets/pulse_page_scaffold.dart';

class VitalsPage extends StatelessWidget {
  const VitalsPage({super.key, required this.authService});

  final AuthService authService;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final border = isDark ? PulseTheme.darkBorder : PulseTheme.border;

    return PulsePageScaffold(
      title: 'Vitals',
      subtitle: 'Learn how your body is doing over time.',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          PulseCard(
            child: Align(
              alignment: Alignment.centerLeft,
              child: FilledButton(
                onPressed: vitalsSimulator.togglePaused,
                child: ValueListenableBuilder(
                  valueListenable: vitalsSimulator,
                  builder: (context, snap, _) {
                    return Text(snap.paused ? 'Resume simulation' : 'Pause simulation');
                  },
                ),
              ),
            ),
          ),
          const SizedBox(height: 14),
          ValueListenableBuilder(
            valueListenable: vitalsSimulator,
            builder: (context, snap, _) {
              return LayoutBuilder(
                builder: (context, constraints) {
                  final wide = constraints.maxWidth >= 900;

                  final heart = _HeartRateCard(snapshot: snap);
                  final steps = _StepsCard(snapshot: snap);
                  final others = [
                    const _VitalStubCard(title: 'Blood Pressure', subtitle: 'No device connected'),
                    const _VitalStubCard(title: 'Oxygen', subtitle: 'No device connected'),
                    const _VitalStubCard(title: 'Temperature', subtitle: 'No device connected'),
                  ];

                  if (!wide) {
                    return Column(
                      children: [
                        heart,
                        const SizedBox(height: 12),
                        steps,
                        const SizedBox(height: 12),
                        for (final c in others) ...[
                          c,
                          const SizedBox(height: 12),
                        ],
                      ],
                    );
                  }

                  return Column(
                    children: [
                      Row(
                        children: [
                          Expanded(child: heart),
                          const SizedBox(width: 12),
                          Expanded(child: steps),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(child: others[0]),
                          const SizedBox(width: 12),
                          Expanded(child: others[1]),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(child: others[2]),
                          const SizedBox(width: 12),
                          Expanded(
                            child: PulseCard(
                              child: SizedBox(
                                height: 180,
                                child: Center(
                                  child: Text(
                                    'Connect devices to unlock more vitals',
                                    style: Theme.of(context).textTheme.bodySmall,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  );
                },
              );
            },
          ),
          const SizedBox(height: 14),
          PulseCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Recent readings', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 10),
                Container(
                  height: 1,
                  color: border,
                ),
                const SizedBox(height: 14),
                Center(
                  child: Text('No readings available', style: Theme.of(context).textTheme.bodySmall),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _VitalStubCard extends StatelessWidget {
  const _VitalStubCard({required this.title, required this.subtitle});

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return PulseCard(
      child: SizedBox(
        height: 180,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: Theme.of(context).textTheme.labelLarge),
            const Spacer(),
            Center(child: Text(subtitle, style: Theme.of(context).textTheme.bodySmall)),
            const Spacer(),
          ],
        ),
      ),
    );
  }
}

class _HeartRateCard extends StatelessWidget {
  const _HeartRateCard({required this.snapshot});

  final VitalsSnapshot snapshot;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final ringBg = isDark ? const Color(0xFF1D1F35) : const Color(0xFFEFF4FF);
    final ringFg = PulseTheme.brandBlue;
    final progress = ((snapshot.heartRateBpm - 55) / (125 - 55)).clamp(0.0, 1.0);

    return PulseCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text('Measuring\nHeart Rate', style: Theme.of(context).textTheme.titleMedium),
              ),
              IconButton(
                tooltip: 'Info',
                onPressed: () {},
                icon: const Icon(Icons.info_outline),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Center(
            child: _RingMeter(
              size: 190,
              progress: progress,
              background: ringBg,
              foreground: ringFg,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.favorite, color: ringFg, size: 34),
                  const SizedBox(height: 8),
                  Text(
                    '${snapshot.heartRateBpm}',
                    style: Theme.of(context).textTheme.displaySmall?.copyWith(fontWeight: FontWeight.w800),
                  ),
                  Text('BPM', style: Theme.of(context).textTheme.bodySmall),
                ],
              ),
            ),
          ),
          const SizedBox(height: 10),
          Center(
            child: Text(
              snapshot.paused ? 'Paused' : 'Measuring BPM...',
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ),
          const SizedBox(height: 10),
          SizedBox(
            height: 86,
            width: double.infinity,
            child: CustomPaint(
              painter: _WavePainter(
                samples: snapshot.hrWave,
                color: PulseTheme.brandBlue.withOpacity(isDark ? 0.9 : 0.75),
                glow: isDark,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _StepsCard extends StatelessWidget {
  const _StepsCard({required this.snapshot});

  final VitalsSnapshot snapshot;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final ringBg = isDark ? const Color(0xFF1D1F35) : const Color(0xFFEFF4FF);
    final ringFg = PulseTheme.brandBlue;
    final goal = 1000;
    final progress = (snapshot.steps / goal).clamp(0.0, 1.0);

    Widget stat(IconData icon, String value, String label) {
      final fg = isDark ? PulseTheme.darkText : PulseTheme.ink;
      final muted = isDark ? PulseTheme.darkMuted : PulseTheme.muted;
      return Expanded(
        child: Column(
          children: [
            Icon(icon, size: 18, color: ringFg),
            const SizedBox(height: 6),
            Text(value, style: TextStyle(color: fg, fontWeight: FontWeight.w800)),
            const SizedBox(height: 2),
            Text(label, style: TextStyle(color: muted, fontSize: 12)),
          ],
        ),
      );
    }

    return PulseCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(child: Text('Pedometer\nMonitor', style: Theme.of(context).textTheme.titleMedium)),
              IconButton(
                tooltip: 'Refresh',
                onPressed: () {},
                icon: const Icon(Icons.refresh),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Center(
            child: _RingMeter(
              size: 190,
              progress: progress,
              background: ringBg,
              foreground: ringFg,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.directions_walk, color: ringFg, size: 34),
                  const SizedBox(height: 8),
                  Text(
                    '${snapshot.steps}',
                    style: Theme.of(context).textTheme.displaySmall?.copyWith(fontWeight: FontWeight.w800),
                  ),
                  Text('Steps', style: Theme.of(context).textTheme.bodySmall),
                ],
              ),
            ),
          ),
          const SizedBox(height: 10),
          Center(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(999),
                border: Border.all(color: isDark ? PulseTheme.darkBorder : PulseTheme.border),
              ),
              child: Text('Goal: $goal steps', style: Theme.of(context).textTheme.bodySmall),
            ),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              stat(Icons.local_fire_department_outlined, '${snapshot.kcal}', 'Kcal'),
              stat(Icons.timer_outlined, '${snapshot.activeMinutes}:${(snapshot.steps % 60).toString().padLeft(2, '0')}', 'Mins'),
              stat(Icons.place_outlined, '${snapshot.distanceKm}', 'Km'),
            ],
          ),
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: vitalsSimulator.togglePaused,
              child: Text(snapshot.paused ? 'Resume' : 'Pause'),
            ),
          ),
        ],
      ),
    );
  }
}

class _RingMeter extends StatelessWidget {
  const _RingMeter({
    required this.size,
    required this.progress,
    required this.background,
    required this.foreground,
    required this.child,
  });

  final double size;
  final double progress;
  final Color background;
  final Color foreground;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(
        painter: _RingPainter(
          progress: progress,
          background: background,
          foreground: foreground,
        ),
        child: Center(child: child),
      ),
    );
  }
}

class _RingPainter extends CustomPainter {
  const _RingPainter({
    required this.progress,
    required this.background,
    required this.foreground,
  });

  final double progress;
  final Color background;
  final Color foreground;

  @override
  void paint(Canvas canvas, Size size) {
    final stroke = 10.0;
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (min(size.width, size.height) - stroke) / 2;

    final bgPaint = Paint()
      ..color = background
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke
      ..strokeCap = StrokeCap.round;

    final fgPaint = Paint()
      ..color = foreground
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke
      ..strokeCap = StrokeCap.round;

    canvas.drawCircle(center, radius, bgPaint);

    final start = -pi / 2;
    final sweep = 2 * pi * progress.clamp(0.0, 1.0);
    canvas.drawArc(Rect.fromCircle(center: center, radius: radius), start, sweep, false, fgPaint);
  }

  @override
  bool shouldRepaint(covariant _RingPainter oldDelegate) {
    return oldDelegate.progress != progress ||
        oldDelegate.background != background ||
        oldDelegate.foreground != foreground;
  }
}

class _WavePainter extends CustomPainter {
  const _WavePainter({
    required this.samples,
    required this.color,
    required this.glow,
  });

  final List<double> samples;
  final Color color;
  final bool glow;

  @override
  void paint(Canvas canvas, Size size) {
    if (samples.isEmpty) return;

    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.5
      ..strokeCap = StrokeCap.round;

    if (glow) {
      final glowPaint = Paint()
        ..color = color.withOpacity(0.35)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 6
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 6);
      _drawPath(canvas, size, glowPaint);
    }
    _drawPath(canvas, size, paint);
  }

  void _drawPath(Canvas canvas, Size size, Paint paint) {
    final path = Path();
    final n = samples.length;
    for (var i = 0; i < n; i++) {
      final t = i / max(1, n - 1);
      final x = t * size.width;
      final y = (1 - samples[i].clamp(0.0, 1.0)) * size.height;
      if (i == 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }
    }
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant _WavePainter oldDelegate) {
    return oldDelegate.samples != samples || oldDelegate.color != color || oldDelegate.glow != glow;
  }
}
