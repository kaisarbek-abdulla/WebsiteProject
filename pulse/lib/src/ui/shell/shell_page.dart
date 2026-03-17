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
          onDestinationSelected: (i) => controller.setSection(_sectionFromMobileIndex(i)),
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
      AppSection.profile => 3,
      _ => 0,
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

