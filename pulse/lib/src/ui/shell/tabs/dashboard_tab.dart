import 'package:flutter/material.dart';

import '../../../api/api_exception.dart';
import '../../../services/auth_service.dart';
import '../../theme/pulse_theme.dart';
import '../widgets/pulse_card.dart';
import '../widgets/pulse_section_title.dart';

class DashboardTab extends StatefulWidget {
  const DashboardTab({super.key, required this.authService});

  final AuthService authService;

  @override
  State<DashboardTab> createState() => _DashboardTabState();
}

class _DashboardTabState extends State<DashboardTab> {
  Map<String, dynamic>? _profile;
  String? _error;
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final p = await widget.authService.profile();
      if (!mounted) return;
      setState(() => _profile = p);
    } on ApiException catch (e) {
      setState(() => _error = e.toString());
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final name = (_profile?['name'] ?? '').toString().trim();
    final greeting = name.isEmpty ? 'Welcome to PULSE' : 'Welcome, $name';

    return CustomScrollView(
      slivers: [
        SliverAppBar(
          pinned: true,
          backgroundColor: PulseTheme.bg,
          surfaceTintColor: PulseTheme.bg,
          title: const Text('Dashboard'),
          actions: [
            IconButton(
              onPressed: _loading ? null : _load,
              icon: const Icon(Icons.refresh),
              tooltip: 'Refresh',
            ),
          ],
          bottom: PreferredSize(
            preferredSize: const Size.fromHeight(1),
            child: Container(height: 1, color: PulseTheme.border),
          ),
        ),
        SliverPadding(
          padding: const EdgeInsets.all(16),
          sliver: SliverList(
            delegate: SliverChildListDelegate(
              [
                Text(
                  greeting,
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
                const SizedBox(height: 6),
                Text(
                  'Your health, simplified. Track symptoms, manage reminders, and get guidance.',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: PulseTheme.muted),
                ),
                const SizedBox(height: 16),
                if (_loading) const LinearProgressIndicator(),
                if (_error != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 12),
                    child: PulseCard(
                      child: Text(
                        _error!,
                        style: TextStyle(color: Theme.of(context).colorScheme.error),
                      ),
                    ),
                  ),
                const SizedBox(height: 16),
                const PulseSectionTitle('Quick stats'),
                const SizedBox(height: 10),
                LayoutBuilder(
                  builder: (context, constraints) {
                    final wide = constraints.maxWidth >= 520;
                    final children = <Widget>[
                      _StatCard(title: 'Symptoms', value: '—', subtitle: 'Logged entries'),
                      _StatCard(title: 'Reminders', value: '—', subtitle: 'Scheduled'),
                      _StatCard(title: 'Devices', value: '—', subtitle: 'Connected'),
                    ];

                    if (!wide) {
                      return Column(
                        children: [
                          for (final c in children) ...[
                            c,
                            const SizedBox(height: 12),
                          ],
                        ],
                      );
                    }

                    return Row(
                      children: [
                        Expanded(child: children[0]),
                        const SizedBox(width: 12),
                        Expanded(child: children[1]),
                        const SizedBox(width: 12),
                        Expanded(child: children[2]),
                      ],
                    );
                  },
                ),
                const SizedBox(height: 16),
                const PulseSectionTitle('Next steps'),
                const SizedBox(height: 10),
                const PulseCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('1. Go to Symptoms and run an analysis.'),
                      SizedBox(height: 6),
                      Text('2. Add Reminders and email notifications.'),
                      SizedBox(height: 6),
                      Text('3. Connect a device (future).'),
                    ],
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

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.title,
    required this.value,
    required this.subtitle,
  });

  final String title;
  final String value;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return PulseCard(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: PulseTheme.brandBlue.withOpacity(0.10),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: PulseTheme.border),
            ),
            child: const Icon(Icons.insights_outlined, color: PulseTheme.brandBlue),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: Theme.of(context).textTheme.labelLarge),
                const SizedBox(height: 2),
                Text(subtitle, style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ),
          Text(
            value,
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontSize: 20),
          ),
        ],
      ),
    );
  }
}

