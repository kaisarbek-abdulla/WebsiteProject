import 'package:flutter/material.dart';

import '../../../services/auth_service.dart';
import '../../theme/pulse_theme.dart';
import '../widgets/pulse_card.dart';
import '../widgets/pulse_page_scaffold.dart';

class RemindersPage extends StatefulWidget {
  const RemindersPage({super.key, required this.authService});

  final AuthService authService;

  @override
  State<RemindersPage> createState() => _RemindersPageState();
}

class _RemindersPageState extends State<RemindersPage> {
  final _message = TextEditingController();
  final List<String> _reminders = [];

  @override
  void dispose() {
    _message.dispose();
    super.dispose();
  }

  void _add() {
    final msg = _message.text.trim();
    if (msg.isEmpty) return;
    setState(() {
      _reminders.insert(0, msg);
      _message.clear();
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final labelColor = isDark ? PulseTheme.brandBlue.withOpacity(0.95) : PulseTheme.brandBlue;

    return PulsePageScaffold(
      title: 'Reminders',
      subtitle: 'Stay on track with scheduled alerts.',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          PulseCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'REMINDER MESSAGE',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: labelColor,
                        letterSpacing: 1.2,
                      ),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: _message,
                  decoration: const InputDecoration(hintText: 'e.g. Take medication at 9:00'),
                  onSubmitted: (_) => _add(),
                ),
                const SizedBox(height: 14),
                Align(
                  alignment: Alignment.centerLeft,
                  child: FilledButton(
                    onPressed: _add,
                    child: const Text('+ Add reminder'),
                  ),
                ),
                const SizedBox(height: 14),
                Center(
                  child: Text(
                    _reminders.isEmpty ? 'No reminders yet. Click above to add one.' : '',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ),
              ],
            ),
          ),
          if (_reminders.isNotEmpty) ...[
            const SizedBox(height: 16),
            PulseCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('History', style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 12),
                  for (final r in _reminders)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Text('• $r'),
                    ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

