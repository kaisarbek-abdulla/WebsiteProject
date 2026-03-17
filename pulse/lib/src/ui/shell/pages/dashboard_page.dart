import 'dart:convert';

import 'package:flutter/material.dart';

import '../../../api/api_exception.dart';
import '../../../services/auth_service.dart';
import '../../theme/pulse_theme.dart';
import '../widgets/pulse_card.dart';
import '../widgets/pulse_page_scaffold.dart';

class DashboardPage extends StatefulWidget {
  const DashboardPage({super.key, required this.authService});

  final AuthService authService;

  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> {
  final _symptoms = TextEditingController();
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _symptoms.dispose();
    super.dispose();
  }

  Future<void> _analyze() async {
    final text = _symptoms.text.trim();
    if (text.isEmpty) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final res = await widget.authService.analyzeSymptoms(text);
      final pretty = const JsonEncoder.withIndent('  ').convert(res);
      if (!mounted) return;
      await showDialog<void>(
        context: context,
        builder: (context) {
          return AlertDialog(
            title: const Text('Symptom analysis'),
            content: SizedBox(
              width: 720,
              child: SingleChildScrollView(
                child: SelectableText(pretty, style: const TextStyle(fontFamily: 'Consolas')),
              ),
            ),
            actions: [
              TextButton(onPressed: () => Navigator.pop(context), child: const Text('Close')),
            ],
          );
        },
      );
    } on ApiException catch (e) {
      setState(() => _error = e.toString());
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return PulsePageScaffold(
      title: 'Dashboard',
      subtitle: 'Overview and quick actions.',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          LayoutBuilder(
            builder: (context, constraints) {
              final wide = constraints.maxWidth >= 980;
              final left = Expanded(
                flex: 7,
                child: PulseCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text('Symptom Analysis', style: Theme.of(context).textTheme.titleMedium),
                      const SizedBox(height: 6),
                      Text('Describe your symptoms', style: Theme.of(context).textTheme.bodySmall),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _symptoms,
                        minLines: 4,
                        maxLines: 8,
                        decoration: const InputDecoration(
                          hintText: 'e.g. headache, fatigue, sore throat...',
                        ),
                      ),
                      const SizedBox(height: 14),
                      Align(
                        alignment: Alignment.centerRight,
                        child: FilledButton.icon(
                          onPressed: _busy ? null : _analyze,
                          icon: const Icon(Icons.search),
                          label: Text(_busy ? 'Analyzing...' : 'Analyze'),
                        ),
                      ),
                      if (_error != null) ...[
                        const SizedBox(height: 12),
                        Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
                      ],
                    ],
                  ),
                ),
              );

              final right = Expanded(
                flex: 4,
                child: PulseCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      _MiniStat(title: 'Symptom\nReports', value: '0', subtitle: 'Symptom Reports'),
                      const SizedBox(height: 12),
                      _MiniStat(title: 'Active\nReminders', value: '0', subtitle: 'Manage reminders'),
                      const SizedBox(height: 12),
                      _MiniStat(title: 'Connected\nDevices', value: '0', subtitle: 'Wearables'),
                      const SizedBox(height: 12),
                      _MiniStat(title: 'Health\nMetrics', value: '0', subtitle: 'Health Metrics'),
                    ],
                  ),
                ),
              );

              if (!wide) {
                return Column(
                  children: [
                    left,
                    const SizedBox(height: 16),
                    right,
                  ],
                );
              }
              return Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  left,
                  const SizedBox(width: 16),
                  right,
                ],
              );
            },
          ),
          const SizedBox(height: 18),
          PulseCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text('Health Metrics', style: Theme.of(context).textTheme.titleMedium),
                    ),
                    FilledButton(
                      onPressed: () {},
                      child: const Text('View vitals'),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                Wrap(
                  spacing: 12,
                  runSpacing: 12,
                  children: const [
                    _MetricTile(icon: Icons.favorite, label: 'Heart Rate'),
                    _MetricTile(icon: Icons.monitor_heart_outlined, label: 'Blood Pressure'),
                    _MetricTile(icon: Icons.air, label: 'Oxygen'),
                    _MetricTile(icon: Icons.directions_walk, label: 'Steps'),
                    _MetricTile(icon: Icons.monitor_weight_outlined, label: 'Weight'),
                    _MetricTile(icon: Icons.thermostat_outlined, label: 'Temperature'),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _MiniStat extends StatelessWidget {
  const _MiniStat({
    required this.title,
    required this.value,
    required this.subtitle,
  });

  final String title;
  final String value;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final border = isDark ? PulseTheme.darkBorder : PulseTheme.border;
    final bg = isDark ? const Color(0xFF262844) : const Color(0xFFF8FAFC);

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title.toUpperCase(),
            style: Theme.of(context).textTheme.bodySmall?.copyWith(letterSpacing: 1.2),
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  color: PulseTheme.brandBlue,
                  fontSize: 30,
                ),
          ),
          const SizedBox(height: 6),
          Text(subtitle, style: Theme.of(context).textTheme.bodySmall),
        ],
      ),
    );
  }
}

class _MetricTile extends StatelessWidget {
  const _MetricTile({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final border = isDark ? PulseTheme.darkBorder : PulseTheme.border;
    final bg = isDark ? const Color(0xFF262844) : const Color(0xFFF8FAFC);
    final fg = isDark ? PulseTheme.brandBlue.withOpacity(0.95) : PulseTheme.brandBlue;

    return SizedBox(
      width: 172,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: border),
        ),
        child: Column(
          children: [
            Icon(icon, color: fg),
            const SizedBox(height: 10),
            Text(label, style: TextStyle(color: fg, fontWeight: FontWeight.w700)),
            const SizedBox(height: 4),
            Text('No data', style: Theme.of(context).textTheme.bodySmall),
          ],
        ),
      ),
    );
  }
}

