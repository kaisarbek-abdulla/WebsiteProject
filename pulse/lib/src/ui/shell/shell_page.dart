import 'package:flutter/material.dart';

import '../../services/auth_service.dart';
import '../../state/app_controller.dart';
import '../../state/app_scope.dart';
import '../theme/pulse_theme.dart';
import 'widgets/pulse_sidebar.dart';
import 'widgets/pulse_topbar.dart';
import 'pages/complaints_page.dart';
import 'pages/dashboard_page.dart';
import 'pages/devices_page.dart';
import 'pages/nutrition_page.dart';
import 'pages/profile_page.dart';
import 'pages/reminders_page.dart';
import 'pages/reports_page.dart';
import 'pages/symptoms_page.dart';
import 'pages/vitals_page.dart';

class ShellPage extends StatelessWidget {
  const ShellPage({
    super.key,
    required this.authService,
    required this.onLogout,
  });

  final AuthService authService;
  final VoidCallback onLogout;

  @override
  Widget build(BuildContext context) {
    final controller = AppScope.of(context);
    final isWide = MediaQuery.sizeOf(context).width >= 980;

    final content = _sectionContent(controller.section);

    final bg = _Background(child: content);

    if (!isWide) {
      // Mobile layout: keep a bottom nav feel but still match the web styling.
      return Scaffold(
        body: SafeArea(child: bg),
        bottomNavigationBar: NavigationBar(
          selectedIndex: _mobileIndex(controller.section),
          onDestinationSelected: (i) async {
            if (i == 3) {
              await _showMobileMoreSheet(context, controller);
              return;
            }
            controller.setSection(_sectionFromMobileIndex(i));
          },
          destinations: const [
            NavigationDestination(
              icon: Icon(Icons.dashboard_outlined),
              selectedIcon: Icon(Icons.dashboard),
              label: 'Dashboard',
            ),
            NavigationDestination(
              icon: Icon(Icons.health_and_safety_outlined),
              selectedIcon: Icon(Icons.health_and_safety),
              label: 'Symptoms',
            ),
            NavigationDestination(
              icon: Icon(Icons.notifications_outlined),
              selectedIcon: Icon(Icons.notifications),
              label: 'Reminders',
            ),
            NavigationDestination(
              icon: Icon(Icons.grid_view_outlined),
              selectedIcon: Icon(Icons.grid_view),
              label: 'More',
            ),
            NavigationDestination(
              icon: Icon(Icons.person_outline),
              selectedIcon: Icon(Icons.person),
              label: 'Profile',
            ),
          ],
        ),
      );
    }

    return Scaffold(
      body: SafeArea(
        child: Row(
          children: [
            PulseSidebar(
              selected: controller.section,
              onSelect: controller.setSection,
            ),
            Expanded(
              child: Column(
                children: [
                  PulseTopbar(
                    authService: authService,
                    onLogout: () async {
                      await authService.logout();
                      onLogout();
                    },
                  ),
                  Expanded(child: bg),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _sectionContent(AppSection section) {
    return switch (section) {
      AppSection.dashboard => DashboardPage(authService: authService),
      AppSection.symptoms => SymptomsPage(authService: authService),
      AppSection.reminders => RemindersPage(authService: authService),
      AppSection.devices => DevicesPage(authService: authService),
      AppSection.vitals => VitalsPage(authService: authService),
      AppSection.nutrition => NutritionPage(authService: authService),
      AppSection.reports => ReportsPage(authService: authService),
      AppSection.complaints => ComplaintsPage(authService: authService),
      AppSection.profile => ProfilePage(authService: authService),
    };
  }

  int _mobileIndex(AppSection section) {
    return switch (section) {
      AppSection.dashboard => 0,
      AppSection.symptoms => 1,
      AppSection.reminders => 2,
      AppSection.profile => 4,
      AppSection.devices => 3,
      AppSection.vitals => 3,
      AppSection.nutrition => 3,
      AppSection.reports => 3,
      AppSection.complaints => 3,
    };
  }

  AppSection _sectionFromMobileIndex(int i) {
    return switch (i) {
      0 => AppSection.dashboard,
      1 => AppSection.symptoms,
      2 => AppSection.reminders,
      _ => AppSection.profile,
    };
  }

  Future<void> _showMobileMoreSheet(BuildContext context, AppController controller) async {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bg = isDark ? PulseTheme.darkShell : Colors.white;

    await showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      backgroundColor: bg,
      builder: (context) {
        Widget item({
          required IconData icon,
          required String label,
          required AppSection section,
        }) {
          final selected = controller.section == section;
          return ListTile(
            leading: Icon(icon),
            title: Text(label, style: TextStyle(fontWeight: selected ? FontWeight.w800 : null)),
            trailing: selected ? const Icon(Icons.check) : null,
            onTap: () {
              Navigator.pop(context);
              controller.setSection(section);
            },
          );
        }

        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 6, 16, 10),
                child: Row(
                  children: [
                    Text('Sections', style: Theme.of(context).textTheme.titleMedium),
                    const Spacer(),
                    TextButton(
                      onPressed: () async {
                        Navigator.pop(context);
                        await authService.logout();
                        onLogout();
                      },
                      child: const Text('Logout'),
                    ),
                  ],
                ),
              ),
              item(icon: Icons.watch_outlined, label: 'Devices', section: AppSection.devices),
              item(icon: Icons.favorite_border, label: 'Vitals', section: AppSection.vitals),
              item(
                icon: Icons.restaurant_outlined,
                label: 'Nutrition',
                section: AppSection.nutrition,
              ),
              item(
                icon: Icons.insert_chart_outlined,
                label: 'Reports',
                section: AppSection.reports,
              ),
              item(
                icon: Icons.chat_bubble_outline,
                label: 'Complaints',
                section: AppSection.complaints,
              ),
              const SizedBox(height: 10),
            ],
          ),
        );
      },
    );
  }
}

class _Background extends StatelessWidget {
  const _Background({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final brightness = Theme.of(context).brightness;
    final isDark = brightness == Brightness.dark;
    return Container(
      decoration: BoxDecoration(
        gradient: isDark
            ? const LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [PulseTheme.darkBgTop, PulseTheme.darkBgBottom],
              )
            : const LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [Color(0xFFF8FAFC), Color(0xFFEFF4FF)],
              ),
      ),
      child: child,
    );
  }
}
