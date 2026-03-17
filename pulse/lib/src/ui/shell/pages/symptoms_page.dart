import 'dart:convert';

import 'package:flutter/material.dart';

import '../../../api/api_exception.dart';
import '../../../services/auth_service.dart';
import '../../theme/pulse_theme.dart';
import '../widgets/pulse_card.dart';
import '../widgets/pulse_page_scaffold.dart';

class SymptomsPage extends StatefulWidget {
  const SymptomsPage({super.key, required this.authService});

  final AuthService authService;

  @override
  State<SymptomsPage> createState() => _SymptomsPageState();
}

class _SymptomsPageState extends State<SymptomsPage> {
  final _controller = TextEditingController();
  bool _busy = false;
  String? _error;

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
    });
    try {
      final res = await widget.authService.analyzeSymptoms(text);
      final pretty = const JsonEncoder.withIndent('  ').convert(res);
      if (!mounted) return;
      await showDialog<void>(
        context: context,
        builder: (context) {
          return AlertDialog(
            title: const Text('AI Analysis'),
            content: SizedBox(
              width: 740,
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
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final labelColor = isDark ? PulseTheme.brandBlue.withOpacity(0.95) : PulseTheme.brandBlue;

    return PulsePageScaffold(
      title: 'Symptoms',
      subtitle: 'Describe your symptoms',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          PulseCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'YOUR SYMPTOMS',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: labelColor,
                        letterSpacing: 1.2,
                      ),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: _controller,
                  minLines: 4,
                  maxLines: 10,
                  decoration: const InputDecoration(
                    hintText: 'e.g. headache, fever, cough',
                  ),
                ),
                const SizedBox(height: 14),
                FilledButton(
                  onPressed: _busy ? null : _analyze,
                  child: Text(_busy ? 'Analyzing...' : 'Analyze'),
                ),
                if (_error != null) ...[
                  const SizedBox(height: 12),
                  Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
                ],
              ],
            ),
          ),
          const SizedBox(height: 16),
          PulseCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('History', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 12),
                Center(
                  child: Text('No symptoms logged yet.', style: Theme.of(context).textTheme.bodySmall),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

