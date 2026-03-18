import 'dart:convert';

import 'package:flutter/material.dart';

import '../../../api/api_exception.dart';
import '../../../services/auth_service.dart';
import '../../../state/app_controller.dart';
import '../../../state/app_scope.dart';
import '../../../state/vitals_simulator.dart';
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
              final compact = constraints.maxWidth < 520;
              final leftCard = PulseCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text('Symptom Analysis', style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 6),
                    Text('Describe your symptoms', style: Theme.of(context).textTheme.bodySmall),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _symptoms,
                      minLines: compact ? 3 : 4,
                      maxLines: 8,
                      decoration: const InputDecoration(
                        hintText: 'e.g. headache, fatigue, sore throat...',
                      ),
                    ),
                    const SizedBox(height: 14),
                    if (compact)
                      FilledButton.icon(
                        onPressed: _busy ? null : _analyze,
                        icon: const Icon(Icons.search),
                        label: Text(_busy ? 'Analyzing...' : 'Analyze'),
                      )
                    else
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
              );

              final rightCard = PulseCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    if (compact)
                      GridView.count(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        crossAxisCount: 2,
                        mainAxisSpacing: 12,
                        crossAxisSpacing: 12,
                        childAspectRatio: 1.05,
                        children: const [
                          _MiniStat(
                            title: 'Symptom\nReports',
                            value: '0',
                            subtitle: 'Reports',
                            compact: true,
                          ),
                          _MiniStat(
                            title: 'Active\nReminders',
                            value: '0',
                            subtitle: 'Reminders',
                            compact: true,
                          ),
                          _MiniStat(
                            title: 'Connected\nDevices',
                            value: '0',
                            subtitle: 'Wearables',
                            compact: true,
                          ),
                          _MiniStat(
                            title: 'Health\nMetrics',
                            value: '0',
                            subtitle: 'Metrics',
                            compact: true,
                          ),
                        ],
                      )
                    else ...[
                      const _MiniStat(
                        title: 'Symptom\nReports',
                        value: '0',
                        subtitle: 'Symptom Reports',
                      ),
                      const SizedBox(height: 12),
                      const _MiniStat(
                        title: 'Active\nReminders',
                        value: '0',
                        subtitle: 'Manage reminders',
                      ),
                      const SizedBox(height: 12),
                      const _MiniStat(
                        title: 'Connected\nDevices',
                        value: '0',
                        subtitle: 'Wearables',
                      ),
                      const SizedBox(height: 12),
                      const _MiniStat(
                        title: 'Health\nMetrics',
                        value: '0',
                        subtitle: 'Health Metrics',
                      ),
                    ],
                  ],
                ),
              );

              if (!wide) {
                return Column(
                  children: [
                    leftCard,
                    const SizedBox(height: 14),
                    rightCard,
                  ],
                );
              }
              return Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(flex: 7, child: leftCard),
                  const SizedBox(width: 16),
                  Expanded(flex: 4, child: rightCard),
                ],
              );
            },
          ),
          const SizedBox(height: 14),
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
                      onPressed: () => AppScope.of(context).setSection(AppSection.vitals),
                      child: const Text('View vitals'),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                LayoutBuilder(
                  builder: (context, constraints) {
                    final available = constraints.maxWidth;
                    final cols = available >= 520 ? 3 : 2;
                    final spacing = 12.0;
                    final tileWidth = ((available - spacing * (cols - 1)) / cols)
                        .clamp(140.0, 210.0)
                        .toDouble();
                    final compact = available < 520;

                    return Wrap(
                      spacing: spacing,
                      runSpacing: spacing,
                      children: [
                        _LiveMetricTile(
                          width: tileWidth,
                          kind: _LiveMetricKind.heartRate,
                          compact: compact,
                        ),
                        _MetricTile(
                          width: tileWidth,
                          icon: Icons.monitor_heart_outlined,
                          label: 'Blood Pressure',
                          compact: compact,
                        ),
                        _MetricTile(
                          width: tileWidth,
                          icon: Icons.air,
                          label: 'Oxygen',
                          compact: compact,
                        ),
                        _LiveMetricTile(
                          width: tileWidth,
                          kind: _LiveMetricKind.steps,
                          compact: compact,
                        ),
                        _MetricTile(
                          width: tileWidth,
                          icon: Icons.monitor_weight_outlined,
                          label: 'Weight',
                          compact: compact,
                        ),
                        _MetricTile(
                          width: tileWidth,
                          icon: Icons.thermostat_outlined,
                          label: 'Temperature',
                          compact: compact,
                        ),
                      ],
                    );
                  },
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
    this.compact = false,
  });

  final String title;
  final String value;
  final String subtitle;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final border = isDark ? PulseTheme.darkBorder : PulseTheme.border;
    final bg = isDark ? const Color(0xFF262844) : const Color(0xFFF8FAFC);

    return Container(
      padding: EdgeInsets.all(compact ? 12 : 14),
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
            maxLines: compact ? 2 : null,
            overflow: compact ? TextOverflow.ellipsis : TextOverflow.visible,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  letterSpacing: 1.2,
                  fontSize: compact ? 11 : null,
                ),
          ),
          SizedBox(height: compact ? 6 : 8),
          Text(
            value,
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  color: PulseTheme.brandBlue,
                  fontSize: compact ? 26 : 30,
                ),
          ),
          SizedBox(height: compact ? 4 : 6),
          Text(
            subtitle,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ],
      ),
    );
  }
}

enum _LiveMetricKind { heartRate, steps }

class _LiveMetricTile extends StatelessWidget {
  const _LiveMetricTile({
    required this.width,
    required this.kind,
    required this.compact,
  });

  final double width;
  final _LiveMetricKind kind;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final border = isDark ? PulseTheme.darkBorder : PulseTheme.border;
    final bg = isDark ? const Color(0xFF262844) : const Color(0xFFF8FAFC);
    final fg = isDark ? PulseTheme.brandBlue.withOpacity(0.95) : PulseTheme.brandBlue;

    return SizedBox(
      width: width,
      child: Container(
        padding: EdgeInsets.all(compact ? 12 : 14),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: border),
        ),
        child: ValueListenableBuilder(
          valueListenable: vitalsSimulator,
          builder: (context, snap, _) {
            final icon = kind == _LiveMetricKind.heartRate ? Icons.favorite : Icons.directions_walk;
            final title = kind == _LiveMetricKind.heartRate ? 'Heart Rate' : 'Steps';
            final value = kind == _LiveMetricKind.heartRate ? '${snap.heartRateBpm}' : '${snap.steps}';
            final unit = kind == _LiveMetricKind.heartRate ? 'BPM' : 'today';

            return Column(
              children: [
                Icon(icon, color: fg, size: compact ? 22 : 24),
                SizedBox(height: compact ? 8 : 10),
                Text(
                  title,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: fg,
                    fontWeight: FontWeight.w700,
                    fontSize: compact ? 13 : 14,
                  ),
                ),
                SizedBox(height: compact ? 8 : 10),
                Text(
                  value,
                  style: TextStyle(
                    color: fg,
                    fontWeight: FontWeight.w900,
                    fontSize: compact ? 22 : 24,
                  ),
                ),
                const SizedBox(height: 2),
                Text(unit, style: Theme.of(context).textTheme.bodySmall),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _MetricTile extends StatelessWidget {
  const _MetricTile({
    required this.width,
    required this.icon,
    required this.label,
    required this.compact,
  });

  final double width;
  final IconData icon;
  final String label;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final border = isDark ? PulseTheme.darkBorder : PulseTheme.border;
    final bg = isDark ? const Color(0xFF262844) : const Color(0xFFF8FAFC);
    final fg = isDark ? PulseTheme.brandBlue.withOpacity(0.95) : PulseTheme.brandBlue;

    return SizedBox(
      width: width,
      child: Container(
        padding: EdgeInsets.all(compact ? 12 : 14),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: border),
        ),
        child: Column(
          children: [
            Icon(icon, color: fg, size: compact ? 22 : 24),
            SizedBox(height: compact ? 8 : 10),
            Text(
              label,
              textAlign: TextAlign.center,
              style: TextStyle(
                color: fg,
                fontWeight: FontWeight.w700,
                fontSize: compact ? 13 : 14,
              ),
            ),
            SizedBox(height: compact ? 3 : 4),
            Text('No data', style: Theme.of(context).textTheme.bodySmall),
          ],
        ),
      ),
    );
  }
}
