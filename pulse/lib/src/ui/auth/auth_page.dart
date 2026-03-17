import 'package:flutter/material.dart';

import '../../api/api_exception.dart';
import '../../config/api_config.dart';
import '../../services/auth_service.dart';
import '../theme/pulse_theme.dart';

class AuthPage extends StatefulWidget {
  const AuthPage({
    super.key,
    required this.authService,
    required this.onAuthed,
  });

  final AuthService authService;
  final VoidCallback onAuthed;

  @override
  State<AuthPage> createState() => _AuthPageState();
}

class _AuthPageState extends State<AuthPage> {
  final _formKey = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _name = TextEditingController();
  String _role = 'patient';

  bool _isLogin = true;
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    _name.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _error = null;
    });
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _busy = true;
    });
    try {
      if (_isLogin) {
        await widget.authService.login(
          email: _email.text.trim(),
          password: _password.text,
        );
      } else {
        await widget.authService.register(
          email: _email.text.trim(),
          password: _password.text,
          name: _name.text.trim(),
          role: _role,
        );
      }
      widget.onAuthed();
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
    final apiBase = ApiConfig.apiBase();
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    InputDecoration fieldDecoration({String? hintText}) {
      final fill = isDark ? const Color(0xFF262844) : const Color(0xFFEAF2FF);
      final borderColor = isDark ? PulseTheme.darkBorder : const Color(0xFF23233A);
      return InputDecoration(
        hintText: hintText,
        filled: true,
        fillColor: fill,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: borderColor),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: borderColor),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: PulseTheme.brandBlue.withOpacity(0.9), width: 2),
        ),
      );
    }

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFFF8FAFC), Color(0xFFEEF4FF)],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 420),
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    color: PulseTheme.card,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: PulseTheme.border),
                    boxShadow: const [
                      BoxShadow(
                        color: Color(0x22000000),
                        blurRadius: 24,
                        offset: Offset(0, 14),
                      ),
                      BoxShadow(
                        color: Color(0x12000000),
                        blurRadius: 8,
                        offset: Offset(0, 3),
                      ),
                    ],
                  ),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 48),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Center(
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(12),
                              child: Image.asset(
                                'assets/images/icon-192.png',
                                width: 80,
                                height: 80,
                                fit: BoxFit.cover,
                              ),
                            ),
                          ),
                          const SizedBox(height: 18),
                          Text(
                            _isLogin ? 'Healthcare Virtual\nAssistant' : 'Create Your Account',
                            textAlign: TextAlign.center,
                            style: theme.textTheme.headlineSmall?.copyWith(
                              fontSize: 30,
                              color: PulseTheme.brandBlue,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            _isLogin
                                ? 'Sign in to your account'
                                : 'Get started with Healthcare Virtual Assistant',
                            textAlign: TextAlign.center,
                            style: theme.textTheme.bodyMedium?.copyWith(color: PulseTheme.muted),
                          ),
                          const SizedBox(height: 16),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF1F5F9),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: PulseTheme.border),
                            ),
                            child: Text(
                              'API: $apiBase',
                              style: theme.textTheme.bodySmall,
                            ),
                          ),
                          const SizedBox(height: 16),
                          if (!_isLogin)
                            _Labeled(
                              label: 'FULL NAME',
                              child: TextFormField(
                                controller: _name,
                                textInputAction: TextInputAction.next,
                                decoration: fieldDecoration(hintText: 'John Doe'),
                              ),
                            ),
                          if (!_isLogin) const SizedBox(height: 12),
                          _Labeled(
                            label: 'EMAIL ADDRESS',
                            child: TextFormField(
                              controller: _email,
                              keyboardType: TextInputType.emailAddress,
                              textInputAction: TextInputAction.next,
                              decoration: fieldDecoration(hintText: 'name@example.com'),
                              validator: (v) {
                                final value = (v ?? '').trim();
                                if (value.isEmpty) return 'Email is required';
                                if (!value.contains('@')) return 'Enter a valid email';
                                return null;
                              },
                            ),
                          ),
                          const SizedBox(height: 12),
                          _Labeled(
                            label: 'PASSWORD',
                            child: TextFormField(
                              controller: _password,
                              obscureText: true,
                              textInputAction: TextInputAction.done,
                              decoration: fieldDecoration(hintText: '••••••••'),
                              validator: (v) {
                                if ((v ?? '').isEmpty) return 'Password is required';
                                if ((v ?? '').length < 4) return 'Password too short';
                                return null;
                              },
                              onFieldSubmitted: (_) => _busy ? null : _submit(),
                            ),
                          ),
                          if (!_isLogin) ...[
                            const SizedBox(height: 12),
                            _Labeled(
                              label: 'I AM A...',
                              child: DropdownButtonFormField<String>(
                                value: _role,
                                decoration: fieldDecoration(),
                                items: const [
                                  DropdownMenuItem(value: 'patient', child: Text('Patient')),
                                  DropdownMenuItem(value: 'doctor', child: Text('Doctor')),
                                ],
                                onChanged: _busy ? null : (v) => setState(() => _role = v ?? 'patient'),
                              ),
                            ),
                          ],
                          const SizedBox(height: 12),
                          if (_error != null)
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: theme.colorScheme.errorContainer,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                _error!,
                                style: TextStyle(color: theme.colorScheme.onErrorContainer),
                              ),
                            ),
                          const SizedBox(height: 18),
                          FilledButton(
                            onPressed: _busy ? null : _submit,
                            child: Text(_busy ? 'Please wait...' : (_isLogin ? 'Sign In' : 'Create Account')),
                          ),
                          const SizedBox(height: 6),
                          TextButton(
                            onPressed: _busy
                                ? null
                                : () => setState(() {
                                      _error = null;
                                      _isLogin = !_isLogin;
                                    }),
                            child: Text(_isLogin ? 'Need an account? Register' : 'Have an account? Login'),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _Labeled extends StatelessWidget {
  const _Labeled({required this.label, required this.child});

  final String label;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: PulseTheme.brandBlue,
                letterSpacing: 1.1,
                fontWeight: FontWeight.w700,
              ),
        ),
        const SizedBox(height: 8),
        child,
      ],
    );
  }
}
