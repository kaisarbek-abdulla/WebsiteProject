import 'package:flutter/material.dart';

import '../../../services/auth_service.dart';
import '../../theme/pulse_theme.dart';
import '../widgets/pulse_card.dart';
import '../widgets/pulse_page_scaffold.dart';

class ComplaintsPage extends StatefulWidget {
  const ComplaintsPage({super.key, required this.authService});

  final AuthService authService;

  @override
  State<ComplaintsPage> createState() => _ComplaintsPageState();
}

class _ComplaintsPageState extends State<ComplaintsPage> {
  final _message = TextEditingController();

  @override
  void dispose() {
    _message.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final labelColor = isDark ? PulseTheme.brandBlue.withOpacity(0.95) : PulseTheme.brandBlue;

    return PulsePageScaffold(
      title: 'Complaints',
      subtitle: "Let us know what's wrong.",
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          PulseCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'YOUR MESSAGE',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: labelColor,
                        letterSpacing: 1.2,
                      ),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: _message,
                  minLines: 4,
                  maxLines: 10,
                  decoration: const InputDecoration(hintText: ''),
                ),
                const SizedBox(height: 14),
                FilledButton(
                  onPressed: () {},
                  child: const Text('Submit'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          PulseCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Previous submissions', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 12),
                Center(
                  child: Text(
                    "You haven't submitted anything yet.",
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

