import 'package:flutter/material.dart';

import '../../../state/app_controller.dart';
import '../../theme/pulse_theme.dart';

class PulseSidebar extends StatelessWidget {
  const PulseSidebar({
    super.key,
    required this.selected,
    required this.onSelect,
  });

  final AppSection selected;
  final ValueChanged<AppSection> onSelect;

  static const double width = 220;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bg = isDark ? PulseTheme.darkShell : Colors.white;
    final border = isDark ? PulseTheme.darkBorder : PulseTheme.border;

    return Container(
      width: width,
      decoration: BoxDecoration(
        color: bg,
        border: Border(right: BorderSide(color: border)),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 16),
        child: Column(
          children: [
            const SizedBox(height: 8),
            _NavItem(
              icon: Icons.dashboard_outlined,
              label: 'Dashboard',
              selected: selected == AppSection.dashboard,
              onTap: () => onSelect(AppSection.dashboard),
            ),
            _NavItem(
              icon: Icons.health_and_safety_outlined,
              label: 'Symptoms',
              selected: selected == AppSection.symptoms,
              onTap: () => onSelect(AppSection.symptoms),
            ),
            _NavItem(
              icon: Icons.notifications_outlined,
              label: 'Reminders',
              selected: selected == AppSection.reminders,
              onTap: () => onSelect(AppSection.reminders),
            ),
            _NavItem(
              icon: Icons.watch_outlined,
              label: 'Devices',
              selected: selected == AppSection.devices,
              onTap: () => onSelect(AppSection.devices),
            ),
            _NavItem(
              icon: Icons.favorite_border,
              label: 'Vitals',
              selected: selected == AppSection.vitals,
              onTap: () => onSelect(AppSection.vitals),
            ),
            _NavItem(
              icon: Icons.restaurant_outlined,
              label: 'Nutrition',
              selected: selected == AppSection.nutrition,
              onTap: () => onSelect(AppSection.nutrition),
            ),
            _NavItem(
              icon: Icons.insert_chart_outlined,
              label: 'Reports',
              selected: selected == AppSection.reports,
              onTap: () => onSelect(AppSection.reports),
            ),
            _NavItem(
              icon: Icons.chat_bubble_outline,
              label: 'Complaints',
              selected: selected == AppSection.complaints,
              onTap: () => onSelect(AppSection.complaints),
            ),
            const Spacer(),
            _NavItem(
              icon: Icons.person_outline,
              label: 'Profile',
              selected: selected == AppSection.profile,
              onTap: () => onSelect(AppSection.profile),
            ),
          ],
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  const _NavItem({
    required this.icon,
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final border = isDark ? PulseTheme.darkBorder : PulseTheme.border;

    final bg = selected
        ? PulseTheme.brandBlue.withOpacity(isDark ? 0.95 : 0.12)
        : (isDark ? Colors.transparent : Colors.transparent);
    final fg = selected
        ? (isDark ? Colors.white : PulseTheme.brandBlue)
        : (isDark ? PulseTheme.darkText : PulseTheme.ink);

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Material(
        color: bg,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(14),
          side: BorderSide(color: selected ? Colors.transparent : border),
        ),
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
            child: Row(
              children: [
                Icon(icon, size: 20, color: fg),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    label,
                    style: TextStyle(
                      color: fg,
                      fontWeight: selected ? FontWeight.w700 : FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

