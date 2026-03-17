import 'package:flutter/material.dart';

import '../../../api/api_exception.dart';
import '../../../services/auth_service.dart';
import '../../theme/pulse_theme.dart';
import '../widgets/pulse_card.dart';
import '../widgets/pulse_section_title.dart';

class ProfileTab extends StatefulWidget {
  const ProfileTab({
    super.key,
    required this.authService,
    required this.onLogout,
  });

  final AuthService authService;
  final VoidCallback onLogout;

  @override
  State<ProfileTab> createState() => _ProfileTabState();
}

class _ProfileTabState extends State<ProfileTab> {
  Map<String, dynamic>? _profile;
  String? _error;
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _load();
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
    } on ApiException catch (e) {
      setState(() => _error = e.toString());
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _logout() async {
    await widget.authService.logout();
    widget.onLogout();
  }

  @override
  Widget build(BuildContext context) {
    final name = (_profile?['name'] ?? '').toString();
    final email = (_profile?['email'] ?? '').toString();
    final role = (_profile?['role'] ?? '').toString();

    return CustomScrollView(
      slivers: [
        SliverAppBar(
          pinned: true,
          backgroundColor: PulseTheme.bg,
          surfaceTintColor: PulseTheme.bg,
          title: const Text('Profile'),
          actions: [
            IconButton(
              onPressed: _loading ? null : _load,
              icon: const Icon(Icons.refresh),
              tooltip: 'Refresh',
            ),
            IconButton(
              onPressed: _logout,
              icon: const Icon(Icons.logout),
              tooltip: 'Logout',
            ),
          ],
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
                const PulseSectionTitle('Account'),
                const SizedBox(height: 10),
                if (_loading) const LinearProgressIndicator(),
                if (_error != null) ...[
                  const SizedBox(height: 12),
                  PulseCard(
                    child: Text(
                      _error!,
                      style: TextStyle(color: Theme.of(context).colorScheme.error),
                    ),
                  ),
                ],
                const SizedBox(height: 12),
                PulseCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _Line(label: 'Name', value: name),
                      const SizedBox(height: 8),
                      _Line(label: 'Email', value: email),
                      const SizedBox(height: 8),
                      _Line(label: 'Role', value: role),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                FilledButton.icon(
                  onPressed: _logout,
                  icon: const Icon(Icons.logout),
                  label: const Text('Logout'),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _Line extends StatelessWidget {
  const _Line({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        SizedBox(
          width: 84,
          child: Text(label, style: Theme.of(context).textTheme.bodySmall),
        ),
        Expanded(
          child: Text(
            value.isEmpty ? '—' : value,
            style: Theme.of(context).textTheme.bodyMedium,
          ),
        ),
      ],
    );
  }
}

