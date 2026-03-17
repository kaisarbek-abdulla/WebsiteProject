import 'dart:convert';

import 'package:flutter/material.dart';

import '../../../api/api_exception.dart';
import '../../../services/auth_service.dart';
import '../../theme/pulse_theme.dart';
import '../widgets/pulse_card.dart';
import '../widgets/pulse_section_title.dart';

class SymptomsTab extends StatefulWidget {
  const SymptomsTab({super.key, required this.authService});

  final AuthService authService;

  @override
  State<SymptomsTab> createState() => _SymptomsTabState();
}

class _SymptomsTabState extends State<SymptomsTab> {
  final _controller = TextEditingController();
  bool _busy = false;
  String? _error;
  String? _result;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _analyze() async {
    final text = _controller.text.trim();
    if (text.isEmpty) return;
    setState(() {
      _busy = true;
      _error = null;
      _result = null;
    });
    try {
      final res = await widget.authService.analyzeSymptoms(text);
      final pretty = const JsonEncoder.withIndent('  ').convert(res);
      if (!mounted) return;
      setState(() => _result = pretty);
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
    return CustomScrollView(
      slivers: [
        SliverAppBar(
          pinned: true,
          backgroundColor: PulseTheme.bg,
          surfaceTintColor: PulseTheme.bg,
          title: const Text('Symptoms'),
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
                const PulseSectionTitle('Symptom analysis'),
                const SizedBox(height: 10),
                PulseCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        'Describe symptoms',
                        style: Theme.of(context).textTheme.labelLarge,
                      ),
                      const SizedBox(height: 8),
                      TextField(
                        controller: _controller,
                        minLines: 3,
                        maxLines: 8,
                        decoration: const InputDecoration(
                          hintText: 'e.g. fever and cough',
                        ),
                      ),
                      const SizedBox(height: 12),
                      FilledButton(
                        onPressed: _busy ? null : _analyze,
                        child: Text(_busy ? 'Analyzing...' : 'Analyze'),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'This is informational only. Always consult a medical professional.',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
                if (_error != null) ...[
                  const SizedBox(height: 12),
                  PulseCard(
                    child: Text(
                      _error!,
                      style: TextStyle(color: Theme.of(context).colorScheme.error),
                    ),
                  ),
                ],
                if (_result != null) ...[
                  const SizedBox(height: 12),
                  const PulseSectionTitle('Result'),
                  const SizedBox(height: 10),
                  PulseCard(
                    child: SelectableText(
                      _result!,
                      style: const TextStyle(fontFamily: 'Consolas'),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ],
    );
  }
}

