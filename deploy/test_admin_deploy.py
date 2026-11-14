"""Local deployment-contract tests; never connect to the VPS."""

import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest


ROOT = Path(__file__).resolve().parent.parent
FIRST = "00000000-0000-4000-8000-000000000001"
SECOND = "00000000-0000-4000-8000-000000000002"
OLD_ADMIN = f"ADMIN_ACCOUNT_IDS={FIRST}\n"
NEW_ADMIN = f"ADMIN_ACCOUNT_IDS={SECOND}\n"
OLD_IMAGES = "IMAGE=example.invalid/web:old\nBACKEND_IMAGE=example.invalid/backend:old\n"
ACCOUNT_SETTINGS = "SMTP_PASSWORD='unchanged$secret'\nREGISTRATION_ENABLED=true\n"


class AdminDeploymentTest(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix="admin-deploy-test-")
        self.addCleanup(self.temporary.cleanup)
        self.app = Path(self.temporary.name)
        self.staging = self.app / ".deploy-staging"
        self.staging.mkdir()
        for file in (ROOT / "deploy").glob("*.sh"):
            shutil.copyfile(file, self.staging / file.name)
        for name in ("nginx.conf", "nginx-https.conf"):
            shutil.copyfile(ROOT / "deploy" / name, self.staging / name)
        for file in (ROOT / "deploy" / "systemd").iterdir():
            shutil.copyfile(file, self.staging / file.name)
        shutil.copyfile(ROOT / "compose.yaml", self.staging / "compose.yaml")
        (self.staging / "database-password").write_text("fixture-database-password")
        (self.staging / "admin-account-ids").write_text(SECOND)
        (self.app / ".env").write_text(OLD_IMAGES)
        (self.app / "compose.yaml").write_text("services:\n  previous-composition:\n    image: previous\n")
        (self.app / ".admin.runtime.env").write_text(OLD_ADMIN)
        (self.app / ".admin.runtime.env").chmod(0o600)
        (self.app / ".accounts.runtime.env").write_text(ACCOUNT_SETTINGS)
        (self.app / ".runtime.env").write_text("DATABASE_PASSWORD=fixture-database-password\n")
        self.bin = self.app / "bin"
        self.bin.mkdir()
        docker = self.bin / "docker"
        docker.write_text("""#!/usr/bin/env python3
import json, os, pathlib, sys
app = pathlib.Path(os.environ['APP_DIR'])
def read(name):
    path = app / name
    return path.read_text() if path.exists() else None
with (app / 'docker.calls').open('a') as log:
    log.write(json.dumps({
        'args': sys.argv[1:], 'images': read('.env'), 'admin': read('.admin.runtime.env'),
        'compose': read('compose.yaml'), 'accounts': read('.accounts.runtime.env'),
        'image_override': os.environ.get('IMAGE'), 'backend_override': os.environ.get('BACKEND_IMAGE')
    }) + '\\n')
args = sys.argv[1:]
new = ':new' in (read('.env') or '')
failure = os.environ.get('DEPLOY_TEST_FAILURE')
if 'config' in args and failure == 'config' and new:
    sys.exit(1)
if 'pull' in args and failure == 'pull' and new:
    sys.exit(1)
if 'inspect' in args:
    print('unhealthy' if new and failure == 'health' else 'healthy')
elif 'ps' in args:
    print(args[-1])
""")
        docker.chmod(0o755)
        sleep = self.bin / "sleep"
        sleep.write_text("#!/bin/sh\nexit 0\n")
        sleep.chmod(0o755)
        self.env = {
            **os.environ,
            "PATH": str(self.bin) + os.pathsep + os.environ["PATH"],
            "APP_DIR": str(self.app),
            "IMAGE": "example.invalid/web:new",
            "BACKEND_IMAGE": "example.invalid/backend:new",
        }
        self.old_compose = (self.app / "compose.yaml").read_text()

    def apply(self):
        return subprocess.run(
            ["sh", str(self.staging / "apply-staged-deploy.sh")],
            env=self.env, text=True, capture_output=True, timeout=20,
        )

    def action(self, action):
        return subprocess.run(
            ["sh", str(self.app / "deploy.sh"), action],
            env=self.env, text=True, capture_output=True, timeout=20,
        )

    def calls(self):
        path = self.app / "docker.calls"
        return [json.loads(line) for line in path.read_text().splitlines()] if path.exists() else []

    def assert_restored(self):
        self.assertEqual(OLD_IMAGES, (self.app / ".env").read_text())
        self.assertEqual(OLD_ADMIN, (self.app / ".admin.runtime.env").read_text())
        self.assertEqual(self.old_compose, (self.app / "compose.yaml").read_text())
        self.assertEqual(ACCOUNT_SETTINGS, (self.app / ".accounts.runtime.env").read_text())
        restored_start = [call for call in self.calls() if "up" in call["args"]][-1]
        self.assertEqual(OLD_ADMIN, restored_start["admin"])
        self.assertEqual(OLD_IMAGES, restored_start["images"])
        self.assertIsNone(restored_start["image_override"])
        self.assertIsNone(restored_start["backend_override"])
        self.assertFalse(any("down" in call["args"] for call in self.calls()))

    def test_uuid_validation_rejects_missing_or_injected_values_without_echoing_them(self):
        validator = ROOT / "deploy" / "validate-admin-account-ids.sh"
        candidate = self.app / "candidate"
        for value in ("", "not-a-uuid", FIRST + "\nOTHER=value", FIRST + "\r", FIRST + "\0",
                      FIRST + ",", FIRST + ", " + SECOND):
            with self.subTest(value=repr(value)):
                candidate.write_bytes(value.encode())
                result = subprocess.run(["sh", str(validator), str(candidate)], capture_output=True)
                self.assertNotEqual(0, result.returncode)
                self.assertIn(b"ADMIN_ACCOUNT_IDS", result.stderr)
                self.assertNotIn(FIRST.encode(), result.stdout + result.stderr)
        for value in (FIRST, FIRST + "," + SECOND):
            candidate.write_text(value)
            result = subprocess.run(["sh", str(validator), str(candidate)], capture_output=True)
            self.assertEqual(0, result.returncode, result.stderr)
            self.assertEqual(b"", result.stdout)

    def test_invalid_secret_leaves_existing_deployment_untouched(self):
        (self.staging / "admin-account-ids").write_text("invalid-secret")
        result = self.apply()
        self.assertNotEqual(0, result.returncode)
        self.assertEqual([], self.calls())
        self.assertEqual(OLD_ADMIN, (self.app / ".admin.runtime.env").read_text())
        self.assertEqual(OLD_IMAGES, (self.app / ".env").read_text())
        self.assertEqual(self.old_compose, (self.app / "compose.yaml").read_text())
        self.assertFalse((self.staging / "admin-account-ids").exists())
        self.assertNotIn("invalid-secret", result.stdout + result.stderr)

    def test_success_preserves_account_settings_and_keeps_private_backup_until_finalized(self):
        result = self.apply()
        self.assertEqual(0, result.returncode, result.stderr)
        self.assertEqual(NEW_ADMIN, (self.app / ".admin.runtime.env").read_text())
        self.assertEqual(0o600, (self.app / ".admin.runtime.env").stat().st_mode & 0o777)
        self.assertEqual(OLD_ADMIN, (self.app / ".admin.runtime.env.previous").read_text())
        self.assertEqual(0o600, (self.app / ".admin.runtime.env.previous").stat().st_mode & 0o777)
        self.assertEqual(ACCOUNT_SETTINGS, (self.app / ".accounts.runtime.env").read_text())
        self.assertFalse((self.staging / "admin-account-ids").exists())
        self.assertNotIn(SECOND, result.stdout + result.stderr)
        calls = self.calls()
        config = next(i for i, call in enumerate(calls) if "config" in call["args"])
        pull = next(i for i, call in enumerate(calls) if "pull" in call["args"])
        up = next(i for i, call in enumerate(calls) if "up" in call["args"])
        self.assertLess(config, pull)
        self.assertLess(pull, up)
        self.assertEqual(NEW_ADMIN, calls[up]["admin"])
        self.assertEqual(0, self.action("finalize").returncode)
        self.assertFalse((self.app / ".admin.runtime.env.previous").exists())
        self.assertFalse((self.app / ".env.previous").exists())
        self.assertFalse((self.app / ".compose.yaml.previous").exists())

    def test_incomplete_staging_leaves_existing_configuration_untouched(self):
        (self.staging / "nginx.conf").unlink()
        result = self.apply()
        self.assertNotEqual(0, result.returncode)
        self.assertEqual([], self.calls())
        self.assertEqual(OLD_ADMIN, (self.app / ".admin.runtime.env").read_text())
        self.assertEqual(OLD_IMAGES, (self.app / ".env").read_text())
        self.assertEqual(self.old_compose, (self.app / "compose.yaml").read_text())
        self.assertFalse((self.staging / "admin-account-ids").exists())

    def test_failed_healthcheck_restores_admin_settings_before_restarting_previous_images(self):
        self.env["DEPLOY_TEST_FAILURE"] = "health"
        result = self.apply()
        self.assertNotEqual(0, result.returncode)
        self.assert_restored()

    def test_failed_pull_is_bounded_and_restores_previous_configuration(self):
        self.env["DEPLOY_TEST_FAILURE"] = "pull"
        result = self.apply()
        self.assertNotEqual(0, result.returncode)
        attempts = [call for call in self.calls() if "pull" in call["args"] and ":new" in call["images"]]
        self.assertEqual(3, len(attempts))
        self.assert_restored()

    def test_external_verification_failure_can_restore_the_previous_configuration(self):
        self.assertEqual(0, self.apply().returncode)
        result = self.action("rollback")
        self.assertEqual(0, result.returncode, result.stderr)
        self.assert_restored()

    def test_rollback_removes_admin_file_if_previous_deployment_had_none(self):
        (self.app / ".admin.runtime.env").unlink()
        self.assertEqual(0, self.apply().returncode)
        self.assertEqual(0, self.action("rollback").returncode)
        self.assertFalse((self.app / ".admin.runtime.env").exists())
        restored_start = [call for call in self.calls() if "up" in call["args"]][-1]
        self.assertIsNone(restored_start["admin"])
        self.assertEqual(ACCOUNT_SETTINGS, restored_start["accounts"])

    def test_compose_delivers_admin_secret_to_backend_only_without_overwriting_account_settings(self):
        docker = shutil.which("docker")
        if docker is None:
            self.fail("Docker Compose is required for deployment configuration validation")
        shutil.copyfile(ROOT / "compose.yaml", self.app / "compose.yaml")
        result = subprocess.run([docker, "compose", "-f", str(self.app / "compose.yaml"),
                                 "config", "--format", "json"],
                                capture_output=True, text=True, env={**os.environ,
                                    "IMAGE": self.env["IMAGE"], "BACKEND_IMAGE": self.env["BACKEND_IMAGE"]})
        self.assertEqual(0, result.returncode, result.stderr)
        services = json.loads(result.stdout)["services"]
        self.assertEqual(FIRST, services["backend"]["environment"]["ADMIN_ACCOUNT_IDS"])
        # Compose escapes literal dollars when serializing reusable configuration.
        self.assertEqual("unchanged$secret", services["backend"]["environment"]["SMTP_PASSWORD"].replace("$$", "$"))
        self.assertNotIn("ADMIN_ACCOUNT_IDS", services["postgres"]["environment"])
        self.assertNotIn("ADMIN_ACCOUNT_IDS", services["web"].get("environment", {}))


if __name__ == "__main__":
    unittest.main()
