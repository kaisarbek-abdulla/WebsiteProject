import 'package:flutter/material.dart';

import '../../../services/auth_service.dart';
import '../../theme/pulse_theme.dart';
import '../widgets/pulse_card.dart';
import '../widgets/pulse_page_scaffold.dart';

class VitalsPage extends StatelessWidget {
  const VitalsPage({super.key, required this.authService});

  final AuthService authService;

  @override
  Widget build(BuildContext context) {
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
                onPressed: () {},
                child: const Text('Refresh vitals'),
              ),
            ),
          ),
          const SizedBox(height: 14),
          LayoutBuilder(
            builder: (context, constraints) {
              final wide = constraints.maxWidth >= 900;
              final cards = const [
                _VitalCard(title: 'Heart Rate'),
                _VitalCard(title: 'Blood Pressure'),
                _VitalCard(title: 'Oxygen'),
                _VitalCard(title: 'Temperature'),
              ];

              if (!wide) {
                return Column(
                  children: [
                    for (final c in cards) ...[
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
                      Expanded(child: cards[0]),
                      const SizedBox(width: 12),
                      Expanded(child: cards[1]),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(child: cards[2]),
                      const SizedBox(width: 12),
                      Expanded(child: cards[3]),
                    ],
                  ),
                ],
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
                  color: Theme.of(context).brightness == Brightness.dark
                      ? PulseTheme.darkBorder
                      : PulseTheme.border,
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

class _VitalCard extends StatelessWidget {
  const _VitalCard({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return PulseCard(
      child: SizedBox(
        height: 140,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: Theme.of(context).textTheme.labelLarge),
            const Spacer(),
            Center(child: Text('No data', style: Theme.of(context).textTheme.bodySmall)),
            const Spacer(),
          ],
        ),
      ),
    );
  }
}
