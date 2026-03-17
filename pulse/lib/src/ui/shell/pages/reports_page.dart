import 'package:flutter/material.dart';

import '../../../services/auth_service.dart';
import '../widgets/pulse_card.dart';
import '../widgets/pulse_page_scaffold.dart';

class ReportsPage extends StatelessWidget {
  const ReportsPage({super.key, required this.authService});

  final AuthService authService;

  @override
  Widget build(BuildContext context) {
    return PulsePageScaffold(
      title: 'Reports',
      subtitle: 'Download summaries and export data.',
      child: PulseCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Align(
              alignment: Alignment.centerLeft,
              child: FilledButton(
                onPressed: () {},
                child: const Text('Export reports'),
              ),
            ),
            const SizedBox(height: 18),
            Center(
              child: Text(
                'No reports generated',
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

