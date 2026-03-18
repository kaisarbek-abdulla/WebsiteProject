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
    final w = MediaQuery.sizeOf(context).width;
    final isMobile = w < 600;

    final maxWidth = isMobile ? 560.0 : 1200.0;
    final pagePadding = isMobile
        ? const EdgeInsets.fromLTRB(16, 16, 16, 22)
        : const EdgeInsets.fromLTRB(24, 20, 24, 28);
    final titleSize = isMobile ? 30.0 : 38.0;
    final sectionGap = isMobile ? 14.0 : 18.0;

    return SingleChildScrollView(
      child: Center(
        child: ConstrainedBox(
          constraints: BoxConstraints(maxWidth: maxWidth),
          child: Padding(
            padding: pagePadding,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        color: titleColor,
                        fontSize: titleSize,
                      ),
                ),
                const SizedBox(height: 6),
                Text(
                  subtitle,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: subtitleColor),
                ),
                SizedBox(height: sectionGap),
                child,
                if (!isMobile) ...[
                  const SizedBox(height: 24),
                  Center(
                    child: Text(
                      '© 2026 Healthcare Virtual Assistant',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
