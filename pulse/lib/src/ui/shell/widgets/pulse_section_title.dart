import 'package:flutter/material.dart';

class PulseSectionTitle extends StatelessWidget {
  const PulseSectionTitle(this.text, {super.key, this.trailing});

  final String text;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Text(
            text,
            style: Theme.of(context).textTheme.titleMedium,
          ),
        ),
        if (trailing != null) trailing!,
      ],
    );
  }
}

