import 'package:flutter/material.dart';

import '../../../services/auth_service.dart';
import '../../../state/app_controller.dart';
import '../../../state/app_scope.dart';
import '../../theme/pulse_theme.dart';

class PulseTopbar extends StatelessWidget {
  const PulseTopbar({
    super.key,
    required this.authService,
    required this.onLogout,
  });

  final AuthService authService;
  final VoidCallback onLogout;

  @override
  Widget build(BuildContext context) {
    final controller = AppScope.of(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bg = isDark ? PulseTheme.darkShell : Colors.white;
    final border = isDark ? PulseTheme.darkBorder : PulseTheme.border;

    return Container(
      height: 76,
      decoration: BoxDecoration(
        color: bg,
        border: Border(bottom: BorderSide(color: border)),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 18),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Image.asset(
                'assets/images/icon-192.png',
                width: 42,
                height: 42,
                fit: BoxFit.cover,
              ),
            ),
            const SizedBox(width: 14),
            Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'PULSE',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: PulseTheme.brandBlue,
                        letterSpacing: 0.2,
                      ),
                ),
                Text(
                  'AI Health Assistant',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
            const Spacer(),
            _DropdownPill(
              value: controller.language,
              items: const ['English', 'Русский', 'Қазақша'],
              onChanged: (v) => controller.setLanguage(v),
            ),
            const SizedBox(width: 10),
            IconButton(
              tooltip: isDark ? 'Light theme' : 'Dark theme',
              onPressed: controller.toggleTheme,
              icon: Icon(isDark ? Icons.light_mode_outlined : Icons.dark_mode_outlined),
            ),
            const SizedBox(width: 8),
            _PillButton(
              label: 'Profile →',
              onPressed: () => controller.setSection(AppSection.profile),
            ),
            const SizedBox(width: 10),
            FilledButton(
              style: FilledButton.styleFrom(
                backgroundColor: PulseTheme.danger,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                textStyle: const TextStyle(fontWeight: FontWeight.w700),
              ),
              onPressed: onLogout,
              child: const Text('Logout'),
            ),
          ],
        ),
      ),
    );
  }
}

class _PillButton extends StatelessWidget {
  const _PillButton({required this.label, required this.onPressed});

  final String label;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final border = isDark ? PulseTheme.darkBorder : PulseTheme.border;
    final fg = isDark ? PulseTheme.darkText : PulseTheme.ink;

    return OutlinedButton(
      style: OutlinedButton.styleFrom(
        foregroundColor: fg,
        side: BorderSide(color: border),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
      onPressed: onPressed,
      child: Text(label),
    );
  }
}

class _DropdownPill extends StatelessWidget {
  const _DropdownPill({
    required this.value,
    required this.items,
    required this.onChanged,
  });

  final String value;
  final List<String> items;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final border = isDark ? PulseTheme.darkBorder : PulseTheme.border;
    final fg = isDark ? PulseTheme.darkText : PulseTheme.ink;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 2),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: border),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: value,
          dropdownColor: isDark ? PulseTheme.darkShell : Colors.white,
          style: TextStyle(color: fg),
          items: items
              .map((e) => DropdownMenuItem<String>(value: e, child: Text(e)))
              .toList(),
          onChanged: (v) => v == null ? null : onChanged(v),
        ),
      ),
    );
  }
}

