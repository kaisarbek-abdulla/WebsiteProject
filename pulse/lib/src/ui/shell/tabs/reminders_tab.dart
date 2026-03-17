import 'package:flutter/material.dart';

import '../../../services/auth_service.dart';
import '../../theme/pulse_theme.dart';
import '../widgets/pulse_card.dart';
import '../widgets/pulse_section_title.dart';

class RemindersTab extends StatelessWidget {
  const RemindersTab({super.key, required this.authService});

  final AuthService authService;

  @override
  Widget build(BuildContext context) {
    return CustomScrollView(
      slivers: [
        SliverAppBar(
          pinned: true,
          backgroundColor: PulseTheme.bg,
          surfaceTintColor: PulseTheme.bg,
          title: const Text('Reminders'),
          bottom: PreferredSize(
            preferredSize: const Size.fromHeight(1),
            child: Container(height: 1, color: PulseTheme.border),
          ),
        ),
        SliverPadding(
          padding: const EdgeInsets.all(16),
          sliver: SliverList(
            delegate: SliverChildListDelegate(
              const [
                PulseSectionTitle('Coming next'),
                SizedBox(height: 10),
                PulseCard(
                  child: Text(
                    'Next we will add: create reminder, list reminders, and optional email notifications.',
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

