from html.parser import HTMLParser
from pathlib import Path
import unittest


PAGE = Path(__file__).resolve().parents[1] / "index.html"


class DownloadPageParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_options = False
        self.current_link = None
        self.options = []
        self.images = []
        self.visible_headings = []

    def handle_starttag(self, tag, attributes):
        attributes = dict(attributes)
        if tag == "nav":
            self.in_options = True
        elif tag == "a" and self.in_options:
            self.current_link = {**attributes, "label": ""}
        elif tag == "img":
            self.images.append(attributes)
        elif tag == "h1":
            self.visible_headings.append(tag)

    def handle_data(self, data):
        if self.current_link is not None:
            self.current_link["label"] += data

    def handle_endtag(self, tag):
        if tag == "a" and self.current_link is not None:
            self.current_link["label"] = " ".join(self.current_link["label"].split())
            self.options.append(self.current_link)
            self.current_link = None
        elif tag == "nav":
            self.in_options = False


class DownloadPageTests(unittest.TestCase):
    def setUp(self):
        self.page = DownloadPageParser()
        self.page.feed(PAGE.read_text(encoding="utf-8"))

    def test_three_matching_options_include_web_version(self):
        self.assertEqual(
            [(link["href"], link["label"].removesuffix("↗").strip()) for link in self.page.options],
            [
                (
                    "https://apps.apple.com/bh/app/playbook-network/id1622077073",
                    "Download on the App Store",
                ),
                (
                    "https://play.google.com/store/apps/details?id=com.mightybell.playbook",
                    "Download on Google Play",
                ),
                ("https://app.get-playbook.com/app", "Open Web Version"),
            ],
        )
        self.assertEqual(len({link.get("class") for link in self.page.options}), 1)

    def test_supplied_logo_is_used_with_accessible_text_and_dimensions(self):
        self.assertIn(
            {"src": "42.png", "alt": "PLAYBOOK", "width": "800", "height": "800"},
            self.page.images,
        )

    def test_large_download_heading_is_removed(self):
        self.assertEqual(self.page.visible_headings, [])


if __name__ == "__main__":
    unittest.main()
