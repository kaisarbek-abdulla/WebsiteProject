import 'package:flutter/material.dart';

import '../../../api/api_exception.dart';
import '../../../services/auth_service.dart';
import '../../theme/pulse_theme.dart';
import '../widgets/pulse_card.dart';
import '../widgets/pulse_page_scaffold.dart';

class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key, required this.authService});

  final AuthService authService;

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  Map<String, dynamic>? _profile;
  String? _error;
  bool _loading = false;

  final _fullName = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _roleCtrl = TextEditingController();
  final _age = TextEditingController();
  String _bloodType = '-- Select Blood Type --';
  final _height = TextEditingController();
  final _weight = TextEditingController();
  final _phone = TextEditingController();
  final _allergies = TextEditingController();
  final _medications = TextEditingController();
  final _history = TextEditingController();
  final _emergency = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _fullName.dispose();
    _emailCtrl.dispose();
    _roleCtrl.dispose();
    _age.dispose();
    _height.dispose();
    _weight.dispose();
    _phone.dispose();
    _allergies.dispose();
    _medications.dispose();
    _history.dispose();
    _emergency.dispose();
    super.dispose();
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
      _fullName.text = (p['name'] ?? '').toString();
      _emailCtrl.text = (p['email'] ?? '').toString();
      _roleCtrl.text = (p['role'] ?? '').toString();
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
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final labelColor = isDark ? PulseTheme.brandBlue.withOpacity(0.95) : PulseTheme.brandBlue;

    return PulsePageScaffold(
      title: 'Profile Settings',
      subtitle: 'Personal information and health details.',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (_loading) const LinearProgressIndicator(),
          if (_error != null) ...[
            const SizedBox(height: 12),
            PulseCard(
              child: Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
            ),
          ],
          PulseCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text('Personal Information', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 14),
                _LabeledField(
                  label: 'FULL NAME',
                  labelColor: labelColor,
                  child: TextField(controller: _fullName),
                ),
                const SizedBox(height: 14),
                _LabeledField(
                  label: 'EMAIL',
                  labelColor: labelColor,
                  child: TextField(
                    controller: _emailCtrl,
                    readOnly: true,
                    decoration: const InputDecoration(),
                  ),
                ),
                const SizedBox(height: 14),
                _LabeledField(
                  label: 'ROLE',
                  labelColor: labelColor,
                  child: TextField(
                    controller: _roleCtrl,
                    readOnly: true,
                    decoration: const InputDecoration(),
                  ),
                ),
                const SizedBox(height: 22),
                Text('Health Information', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 14),
                LayoutBuilder(
                  builder: (context, constraints) {
                    final wide = constraints.maxWidth >= 820;
                    if (!wide) {
                      return Column(
                        children: [
                          _LabeledField(
                            label: 'AGE (YEARS)',
                            labelColor: labelColor,
                            child: TextField(controller: _age, decoration: const InputDecoration(hintText: 'Enter your age')),
                          ),
                          const SizedBox(height: 14),
                          _LabeledField(
                            label: 'BLOOD TYPE',
                            labelColor: labelColor,
                            child: _BloodDropdown(value: _bloodType, onChanged: (v) => setState(() => _bloodType = v)),
                          ),
                          const SizedBox(height: 14),
                          _LabeledField(
                            label: 'HEIGHT (CM)',
                            labelColor: labelColor,
                            child: TextField(controller: _height, keyboardType: TextInputType.number, decoration: const InputDecoration(hintText: 'cm')),
                          ),
                          const SizedBox(height: 14),
                          _LabeledField(
                            label: 'WEIGHT (KG)',
                            labelColor: labelColor,
                            child: TextField(controller: _weight, keyboardType: TextInputType.number, decoration: const InputDecoration(hintText: 'kg')),
                          ),
                          const SizedBox(height: 14),
                          _LabeledField(
                            label: 'PHONE NUMBER',
                            labelColor: labelColor,
                            child: TextField(controller: _phone, keyboardType: TextInputType.phone, decoration: const InputDecoration(hintText: '+1 (555) 000-0000')),
                          ),
                        ],
                      );
                    }

                    return Column(
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: _LabeledField(
                                label: 'AGE (YEARS)',
                                labelColor: labelColor,
                                child: TextField(controller: _age, decoration: const InputDecoration(hintText: 'Enter your age')),
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: _LabeledField(
                                label: 'BLOOD TYPE',
                                labelColor: labelColor,
                                child: _BloodDropdown(value: _bloodType, onChanged: (v) => setState(() => _bloodType = v)),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),
                        Row(
                          children: [
                            Expanded(
                              child: _LabeledField(
                                label: 'HEIGHT (CM)',
                                labelColor: labelColor,
                                child: TextField(controller: _height, keyboardType: TextInputType.number, decoration: const InputDecoration(hintText: 'cm')),
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: _LabeledField(
                                label: 'WEIGHT (KG)',
                                labelColor: labelColor,
                                child: TextField(controller: _weight, keyboardType: TextInputType.number, decoration: const InputDecoration(hintText: 'kg')),
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: _LabeledField(
                                label: 'PHONE NUMBER',
                                labelColor: labelColor,
                                child: TextField(controller: _phone, keyboardType: TextInputType.phone, decoration: const InputDecoration(hintText: '+1 (555) 000-0000')),
                              ),
                            ),
                          ],
                        ),
                      ],
                    );
                  },
                ),
                const SizedBox(height: 14),
                _LabeledField(
                  label: 'ALLERGIES',
                  labelColor: labelColor,
                  child: TextField(
                    controller: _allergies,
                    minLines: 2,
                    maxLines: 4,
                    decoration: const InputDecoration(hintText: 'List any known allergies (e.g., Penicillin, Peanuts)'),
                  ),
                ),
                const SizedBox(height: 14),
                _LabeledField(
                  label: 'CURRENT MEDICATIONS',
                  labelColor: labelColor,
                  child: TextField(
                    controller: _medications,
                    minLines: 2,
                    maxLines: 4,
                    decoration: const InputDecoration(hintText: 'List current medications with dosages'),
                  ),
                ),
                const SizedBox(height: 14),
                _LabeledField(
                  label: 'MEDICAL HISTORY',
                  labelColor: labelColor,
                  child: TextField(
                    controller: _history,
                    minLines: 2,
                    maxLines: 4,
                    decoration: const InputDecoration(hintText: 'Relevant medical history, conditions, surgeries, etc.'),
                  ),
                ),
                const SizedBox(height: 18),
                Text('Emergency Contact', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 14),
                _LabeledField(
                  label: 'EMERGENCY CONTACT',
                  labelColor: labelColor,
                  child: TextField(
                    controller: _emergency,
                    decoration: const InputDecoration(hintText: 'Name and phone number of emergency contact'),
                  ),
                ),
                const SizedBox(height: 18),
                Row(
                  children: [
                    FilledButton(onPressed: () {}, child: const Text('Save Profile')),
                    const SizedBox(width: 12),
                    OutlinedButton(onPressed: () {}, child: const Text('Cancel')),
                    const Spacer(),
                    FilledButton(
                      style: FilledButton.styleFrom(backgroundColor: PulseTheme.brandBlue),
                      onPressed: _load,
                      child: const Text('Reload'),
                    ),
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

class _LabeledField extends StatelessWidget {
  const _LabeledField({
    required this.label,
    required this.labelColor,
    required this.child,
  });

  final String label;
  final Color labelColor;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: labelColor,
                letterSpacing: 1.2,
              ),
        ),
        const SizedBox(height: 8),
        child,
      ],
    );
  }
}

class _BloodDropdown extends StatelessWidget {
  const _BloodDropdown({required this.value, required this.onChanged});

  final String value;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    final items = const [
      '-- Select Blood Type --',
      'A+',
      'A-',
      'B+',
      'B-',
      'AB+',
      'AB-',
      'O+',
      'O-',
    ];
    return DropdownButtonFormField<String>(
      value: items.contains(value) ? value : items.first,
      items: items.map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
      onChanged: (v) => v == null ? null : onChanged(v),
    );
  }
}
