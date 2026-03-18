import importlib.util
import pathlib
import unittest


SCRIPT_PATH = pathlib.Path(__file__).resolve().parents[1] / ".github" / "scripts" / "manage_rua_auth_txt.py"
SPEC = importlib.util.spec_from_file_location("manage_rua_auth_txt", SCRIPT_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(MODULE)


class ManageRuaAuthTxtTests(unittest.TestCase):
    def test_validate_customer_domain_accepts_normal_domain(self):
        self.assertEqual(MODULE.validate_customer_domain("Example.COM"), "example.com")

    def test_validate_customer_domain_rejects_own_domain_and_whitespace(self):
        with self.assertRaises(ValueError):
            MODULE.validate_customer_domain("bad domain.com")
        with self.assertRaises(ValueError):
            MODULE.validate_customer_domain("toppymicros.com")

    def test_fqdn_for_builds_expected_name(self):
        self.assertEqual(
            MODULE.fqdn_for("example.com"),
            "example.com._report._dmarc.dmarc4all.toppymicros.com",
        )

    def test_choose_records_prefers_target_content_and_marks_duplicates(self):
        keep_id, extra_ids = MODULE.choose_records(
            [
                {"id": "b", "type": "TXT", "name": "fqdn", "content": "other"},
                {"id": "a", "type": "TXT", "name": "fqdn", "content": "v=DMARC1"},
                {"id": "c", "type": "TXT", "name": "fqdn", "content": "v=DMARC1"},
            ]
        )

        self.assertEqual(keep_id, "a")
        self.assertEqual(extra_ids, ["c", "b"])


if __name__ == "__main__":
    unittest.main()
