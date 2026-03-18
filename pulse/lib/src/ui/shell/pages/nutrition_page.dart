import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';

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

@immutable
class _FoodPer100g {
  const _FoodPer100g({
    required this.kcal,
    required this.proteinG,
    required this.carbsG,
    required this.fatG,
  });

  final double kcal;
  final double proteinG;
  final double carbsG;
  final double fatG;
}

@immutable
class _MealEntry {
  const _MealEntry({
    required this.name,
    required this.grams,
    required this.kcal,
    required this.proteinG,
    required this.carbsG,
    required this.fatG,
  });

  final String name;
  final int grams;
  final double kcal;
  final double proteinG;
  final double carbsG;
  final double fatG;
}

class _NutritionPageState extends State<NutritionPage> {
  final _food = TextEditingController();
  final _grams = TextEditingController(text: '200');
  String? _error;

  final List<_MealEntry> _meals = <_MealEntry>[];

  @override
  void dispose() {
    _food.dispose();
    _grams.dispose();
    super.dispose();
  }

  static final Map<String, _FoodPer100g> _db = <String, _FoodPer100g>{
    // Very small built-in reference (demo). Values are per 100g.
    'banana': _FoodPer100g(kcal: 89, proteinG: 1.1, carbsG: 22.8, fatG: 0.3),
    'apple': _FoodPer100g(kcal: 52, proteinG: 0.3, carbsG: 13.8, fatG: 0.2),
    'rice': _FoodPer100g(kcal: 130, proteinG: 2.7, carbsG: 28.2, fatG: 0.3), // cooked
    'pasta': _FoodPer100g(kcal: 131, proteinG: 5.0, carbsG: 25.0, fatG: 1.1), // cooked
    'potato': _FoodPer100g(kcal: 77, proteinG: 2.0, carbsG: 17.0, fatG: 0.1),
    'bread': _FoodPer100g(kcal: 265, proteinG: 9.0, carbsG: 49.0, fatG: 3.2),
    'egg': _FoodPer100g(kcal: 143, proteinG: 13.0, carbsG: 1.1, fatG: 9.5),
    'milk': _FoodPer100g(kcal: 42, proteinG: 3.4, carbsG: 5.0, fatG: 1.0),
    'yogurt': _FoodPer100g(kcal: 59, proteinG: 10.0, carbsG: 3.6, fatG: 0.4),
    'chicken': _FoodPer100g(kcal: 165, proteinG: 31.0, carbsG: 0.0, fatG: 3.6),
    'beef': _FoodPer100g(kcal: 250, proteinG: 26.0, carbsG: 0.0, fatG: 15.0),
    'salad': _FoodPer100g(kcal: 20, proteinG: 1.2, carbsG: 3.6, fatG: 0.2),
    'oatmeal': _FoodPer100g(kcal: 68, proteinG: 2.4, carbsG: 12.0, fatG: 1.4), // cooked
  };

  _FoodPer100g? _lookup(String rawName) {
    final name = rawName.trim().toLowerCase();
    if (name.isEmpty) return null;
    // Try exact key first, then substring match.
    if (_db.containsKey(name)) return _db[name];
    for (final k in _db.keys) {
      if (name.contains(k)) return _db[k];
    }
    return null;
  }

  void _add() {
    final name = _food.text.trim();
    final grams = int.tryParse(_grams.text.trim()) ?? 0;
    final food = _lookup(name);
    if (name.isEmpty) return;
    if (grams <= 0) {
      setState(() => _error = 'Enter a valid weight in grams.');
      return;
    }
    if (food == null) {
      setState(() => _error = 'Unknown dish. Try: ${_db.keys.take(6).join(', ')}');
      return;
    }

    final factor = grams / 100.0;
    final entry = _MealEntry(
      name: name,
      grams: grams,
      kcal: food.kcal * factor,
      proteinG: food.proteinG * factor,
      carbsG: food.carbsG * factor,
      fatG: food.fatG * factor,
    );

    setState(() {
      _error = null;
      _meals.insert(0, entry);
      _food.clear();
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final labelColor = isDark ? PulseTheme.brandBlue.withOpacity(0.95) : PulseTheme.brandBlue;

    double totalKcal() => _meals.fold(0, (a, b) => a + b.kcal);
    double totalP() => _meals.fold(0, (a, b) => a + b.proteinG);
    double totalC() => _meals.fold(0, (a, b) => a + b.carbsG);
    double totalF() => _meals.fold(0, (a, b) => a + b.fatG);

    return PulsePageScaffold(
      title: 'Nutrition',
      subtitle: 'Log meals and estimate macros (protein, carbs, fat).',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          PulseCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'DISH NAME',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: labelColor,
                        letterSpacing: 1.2,
                      ),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: _food,
                  decoration: const InputDecoration(hintText: 'e.g. chicken, rice, banana'),
                ),
                const SizedBox(height: 14),
                Text(
                  'WEIGHT (GRAMS)',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: labelColor,
                        letterSpacing: 1.2,
                      ),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: _grams,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(hintText: '200'),
                ),
                const SizedBox(height: 14),
                FilledButton(onPressed: _add, child: const Text('Add')),
                if (_error != null) ...[
                  const SizedBox(height: 12),
                  Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
                ],
                const SizedBox(height: 10),
                Text(
                  'Tip: we use a small built-in food list for now. Later we can connect to a real nutrition API or your backend.',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
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
                Text('Calories: ${totalKcal().toStringAsFixed(0)} kcal'),
                const SizedBox(height: 6),
                Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  children: [
                    _MacroChip(label: 'Protein', value: '${totalP().toStringAsFixed(1)} g'),
                    _MacroChip(label: 'Carbs', value: '${totalC().toStringAsFixed(1)} g'),
                    _MacroChip(label: 'Fat', value: '${totalF().toStringAsFixed(1)} g'),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          PulseCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Meals', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 12),
                if (_meals.isEmpty)
                  Center(child: Text('No meals logged yet.', style: Theme.of(context).textTheme.bodySmall))
                else
                  Column(
                    children: [
                      for (var i = 0; i < _meals.length; i++) ...[
                        _MealRow(
                          entry: _meals[i],
                          onRemove: () => setState(() => _meals.removeAt(i)),
                        ),
                        if (i != _meals.length - 1) const Divider(height: 18),
                      ],
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

class _MacroChip extends StatelessWidget {
  const _MacroChip({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final border = isDark ? PulseTheme.darkBorder : PulseTheme.border;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: border),
      ),
      child: Text('$label: $value', style: Theme.of(context).textTheme.bodySmall),
    );
  }
}

class _MealRow extends StatelessWidget {
  const _MealRow({required this.entry, required this.onRemove});

  final _MealEntry entry;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    final muted = Theme.of(context).brightness == Brightness.dark ? PulseTheme.darkMuted : PulseTheme.muted;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '${entry.name} • ${entry.grams}g',
                style: const TextStyle(fontWeight: FontWeight.w800),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 4),
              Text(
                '${entry.kcal.toStringAsFixed(0)} kcal  |  P ${entry.proteinG.toStringAsFixed(1)}g  C ${entry.carbsG.toStringAsFixed(1)}g  F ${entry.fatG.toStringAsFixed(1)}g',
                style: TextStyle(color: muted, fontSize: 12),
              ),
            ],
          ),
        ),
        IconButton(
          tooltip: 'Remove',
          onPressed: onRemove,
          icon: const Icon(Icons.close),
        ),
      ],
    );
  }
}
