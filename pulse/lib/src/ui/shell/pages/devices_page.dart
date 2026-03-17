import 'package:flutter/material.dart';

import '../../../services/auth_service.dart';
import '../widgets/pulse_card.dart';
import '../widgets/pulse_page_scaffold.dart';

class DevicesPage extends StatelessWidget {
  const DevicesPage({super.key, required this.authService});

  final AuthService authService;

  @override
  Widget build(BuildContext context) {
    return PulsePageScaffold(
      title: 'Devices',
      subtitle: 'Link smart watches and trackers for live data.',
      child: PulseCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Align(
              alignment: Alignment.centerLeft,
              child: FilledButton(
                onPressed: () {},
                child: const Text('Connect new device'),
              ),
            ),
            const SizedBox(height: 18),
            Center(
              child: Text(
                'No devices connected',
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

