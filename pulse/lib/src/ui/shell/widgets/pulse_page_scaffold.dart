import 'package:flutter/material.dart';

import '../../theme/pulse_theme.dart';

class PulsePageScaffold extends StatelessWidget {
  const PulsePageScaffold({
    super.key,
    required this.title,
    required this.subtitle,
    required this.child,
  });

  final String title;
  final String subtitle;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final titleColor = isDark ? PulseTheme.brandBlue.withOpacity(0.95) : PulseTheme.brandBlue;
    final subtitleColor = isDark ? PulseTheme.darkMuted : PulseTheme.muted;

    return SingleChildScrollView(
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 1200),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(24, 20, 24, 28),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        color: titleColor,
                        fontSize: 38,
                      ),
                ),
                const SizedBox(height: 6),
                Text(
                  subtitle,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: subtitleColor),
                ),
                const SizedBox(height: 18),
                child,
                const SizedBox(height: 24),
                Center(
                  child: Text(
                    '© 2026 Healthcare Virtual Assistant',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

