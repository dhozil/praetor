"""Pytest config for gltest direct-mode on Windows.

genlayer-test's loader replaces stdin (fd 0) with an encoded-message temp file
and then tries to os.unlink() it while fd 0 still holds the handle. On Windows
you cannot delete a file with an open handle, so deletion fails with
PermissionError. We make os.unlink() tolerant of that case (the leaked file sits
in the OS temp dir and is harmless for local runs).
"""

import os

_orig_unlink = os.unlink


def _windows_safe_unlink(path, *, dir_fd=None):
    try:
        _orig_unlink(path, dir_fd=dir_fd)
    except PermissionError:
        pass


def pytest_configure(config):
    if os.name == "nt":
        os.unlink = _windows_safe_unlink