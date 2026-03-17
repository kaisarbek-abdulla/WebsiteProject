import 'package:flutter/material.dart';

import '../../../services/auth_service.dart';
import '../../theme/pulse_theme.dart';
import '../widgets/pulse_card.dart';
import '../widgets/pulse_page_scaffold.dart';

class NutritionPage extends StatefulWidget {
  const NutritionPage({super.key, required this.authService});

  final AuthService authService;

  @override
  State<NutritionPage> createState() => _NutritionPageState();
}

class _NutritionPageState extends State<NutritionPage> {
  final _food = TextEditingController();
  final _calories = TextEditingController();
  int _totalCalories = 0;

  @override
  void dispose() {
    _food.dispose();
    _calories.dispose();
    super.dispose();
  }

  void _add() {
    final cals = int.tryParse(_calories.text.trim()) ?? 0;
    if (_food.text.trim().isEmpty || cals <= 0) return;
    setState(() {
      _totalCalories += cals;
      _food.clear();
      _calories.clear();
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final labelColor = isDark ? PulseTheme.brandBlue.withOpacity(0.95) : PulseTheme.brandBlue;

    return PulsePageScaffold(
      title: 'Nutrition',
      subtitle: 'Log meals and monitor calories.',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          PulseCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'FOOD ITEM',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: labelColor,
                        letterSpacing: 1.2,
                      ),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: _food,
                  decoration: const InputDecoration(hintText: 'e.g. Banana'),
                ),
                const SizedBox(height: 14),
                Text(
                  'CALORIES',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: labelColor,
                        letterSpacing: 1.2,
                      ),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: _calories,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(hintText: '200'),
                ),
                const SizedBox(height: 14),
                FilledButton(onPressed: _add, child: const Text('Add')),
              ],
            ),
          ),
          const SizedBox(height: 16),
          PulseCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Daily summary', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 8),
                Text('Total calories: $_totalCalories kcal'),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

