import 'package:flutter/material.dart';

import 'services/auth_service.dart';
import 'services/token_store.dart';
import 'state/app_controller.dart';
import 'state/app_scope.dart';
import 'ui/auth/auth_page.dart';
import 'ui/shell/shell_page.dart';
import 'ui/theme/pulse_theme.dart';

class PulseApp extends StatefulWidget {
  const PulseApp({super.key});

  @override
  State<PulseApp> createState() => _PulseAppState();
}

class _PulseAppState extends State<PulseApp> {
  late final TokenStore _tokenStore = TokenStore();
  late final AppController _controller = AppController(tokenStore: _tokenStore);
  late final Future<void> _loaded = _controller.loadPrefs();

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<void>(
      future: _loaded,
      builder: (context, snapshot) {
        return AppScope(
          controller: _controller,
          child: AnimatedBuilder(
            animation: _controller,
            builder: (context, _) {
              return MaterialApp(
                title: 'PULSE',
                theme: PulseTheme.light(),
                darkTheme: PulseTheme.dark(),
                themeMode: _controller.themeMode,
                home: _AuthGate(tokenStore: _tokenStore),
              );
            },
          ),
        );
      },
    );
  }
}

class _AuthGate extends StatefulWidget {
  const _AuthGate({required this.tokenStore});

  final TokenStore tokenStore;

  @override
  State<_AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends State<_AuthGate> {
  late final AuthService _authService =
      AuthService(tokenStore: widget.tokenStore);

  Future<String?> _loadToken() => widget.tokenStore.readToken();

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<String?>(
      future: _loadToken(),
      builder: (context, snapshot) {
        final token = snapshot.data;
        if (snapshot.connectionState != ConnectionState.done) {
          return const Scaffold(body: Center(child: CircularProgressIndicator()));
        }

        if (token == null || token.isEmpty) {
          return AuthPage(
            authService: _authService,
            onAuthed: () => setState(() {}),
          );
        }

        return ShellPage(
          authService: _authService,
          onLogout: () => setState(() {}),
        );
      },
    );
  }
}
