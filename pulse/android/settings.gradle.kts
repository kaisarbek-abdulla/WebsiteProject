pluginManagement {
    val flutterSdkPath = run {
        val properties = java.util.Properties()
        val localProps = file("local.properties")
        if (localProps.exists()) {
            // Java Properties defaults to ISO-8859-1. Prefer UTF-8 so non-ASCII paths survive.
            localProps.reader(Charsets.UTF_8).use { properties.load(it) }
        }

        val fromProps = properties.getProperty("flutter.sdk")
        val fromEnv = System.getenv("FLUTTER_ROOT")
        val fromRelative = file("..\\..\\flutter").canonicalPath
        val preferredAsciiSdk = "C:\\flutter"

        fun hasFlutterGradle(path: String?): Boolean {
            if (path.isNullOrBlank()) return false
            return java.io.File(path, "packages/flutter_tools/gradle").exists()
        }

        // Prefer an ASCII-only SDK path on Windows to avoid mojibake (e.g. `Рабочий стол` -> `Ð Ð°...`).
        // Then try local.properties, then FLUTTER_ROOT, then repo-local checkout.
        listOf(preferredAsciiSdk, fromProps, fromEnv, fromRelative).firstOrNull(::hasFlutterGradle)
            ?: error(
                "Flutter SDK not found. Set FLUTTER_ROOT or flutter.sdk in local.properties, " +
                    "or ensure ../../flutter exists.",
            )
    }

    includeBuild(java.io.File(flutterSdkPath, "packages/flutter_tools/gradle").path)

    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

plugins {
    id("dev.flutter.flutter-plugin-loader") version "1.0.0"
    id("com.android.application") version "8.11.1" apply false
    id("org.jetbrains.kotlin.android") version "2.2.20" apply false
}

include(":app")
